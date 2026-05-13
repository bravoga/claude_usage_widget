mod commands;
mod config;
mod oauth;
mod usage;
mod watcher;

use commands::{AppState, EntriesCache, OAuthCache};
use config::load_config;
use std::sync::Mutex;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

fn load_tray_icon() -> tauri::image::Image<'static> {
    let png = include_bytes!("../icons/icon.png");
    let img = image::load_from_memory_with_format(png, image::ImageFormat::Png)
        .expect("tray icon PNG decode failed")
        .into_rgba8();
    let (w, h) = img.dimensions();
    tauri::image::Image::new_owned(img.into_raw(), w, h)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            config: Mutex::new(load_config()),
            cache: Mutex::new(EntriesCache::default()),
            oauth_cache: Mutex::new(OAuthCache::default()),
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_usage_stats,
            commands::get_config,
            commands::save_config,
            commands::get_oauth_usage,
            commands::open_url,
        ])
        .setup(|app| {
            let show_hide = MenuItemBuilder::with_id("show_hide", "Show / Hide").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&show_hide)
                .separator()
                .item(&quit)
                .build()?;

            let icon = load_tray_icon();

            TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("Claude Usage Widget")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show_hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            let handle = app.handle().clone();
            std::thread::spawn(move || watcher::start_watcher(handle));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
