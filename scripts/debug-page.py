#!/usr/bin/env python3
"""Debug script to capture console errors and screenshot the kechuang-mentor demo."""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        console_messages = []
        page_errors = []

        def on_console(msg):
            console_messages.append(f"[{msg.type}] {msg.text}")

        def on_pageerror(err):
            page_errors.append(f"PAGEERROR: {err}\n{err.stack if hasattr(err, 'stack') else ''}")

        def on_requestfailed(req):
            page_errors.append(f"REQFAIL: {req.url} - {req.failure}")

        page.on("console", on_console)
        page.on("pageerror", on_pageerror)
        page.on("requestfailed", on_requestfailed)

        print("Opening http://localhost:3000/...")
        try:
            await page.goto("http://localhost:3000/", wait_until="networkidle", timeout=15000)
        except Exception as e:
            print(f"Navigation error: {e}")

        await page.wait_for_timeout(5000)

        root_len = await page.evaluate("document.getElementById('root')?.innerHTML?.length || 0")
        body_text = await page.evaluate("document.body.innerText.substring(0, 500)")
        title = await page.title()

        print("---")
        print(f"Title: {title}")
        print(f"Root content length: {root_len}")
        print(f"Body text (first 500): {body_text}")
        print("---")
        print("Console messages:")
        for m in console_messages:
            print(f"  {m}")
        print("---")
        print("Page errors:")
        for e in page_errors:
            print(f"  {e}")
        print("---")

        await page.screenshot(path="/app/data/所有对话/主对话/kechuang-mentor/docs/screenshots/debug-pw.png", full_page=True)
        print("Screenshot saved")

        await browser.close()

asyncio.run(main())
