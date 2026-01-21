#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        # Navigate to the game
        page.goto('http://localhost:8000/shatterrealms_v5.html')

        # Wait for the page to load
        time.sleep(2)

        # Take screenshot of the menu
        page.screenshot(path='screenshot_menu.png')
        print('Menu screenshot saved')

        # Click computer mode
        page.click('text=Computer')
        time.sleep(0.5)

        # Click play
        page.click('text=Play')
        time.sleep(1)

        # Click on the canvas to enable controls
        page.click('canvas')
        time.sleep(2)

        # Take gameplay screenshot
        page.screenshot(path='screenshot_gameplay.png')
        print('Gameplay screenshot saved')

        # Wait a bit more for enemies to spawn
        time.sleep(3)
        page.screenshot(path='screenshot_enemies.png')
        print('Enemies screenshot saved')

        browser.close()

if __name__ == '__main__':
    take_screenshot()
