package com.flawless

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import org.hamcrest.Matcher

object WaitUtils {
    
    private fun getDevice(): UiDevice {
        return UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
    }

    fun waitForText(text: String, timeout: Long = 10000): Boolean {
        return getDevice().wait(Until.hasObject(By.textContains(text)), timeout)
    }

    fun waitForContentDescription(desc: String, timeout: Long = 10000): Boolean {
        return getDevice().wait(Until.hasObject(By.descContains(desc)), timeout)
    }
    
    fun isTextVisible(text: String): Boolean {
        return getDevice().hasObject(By.textContains(text))
    }

    // Safer replacement for Espresso asserts
    fun assertTextVisible(text: String, timeout: Long = 5000) {
        if (!waitForText(text, timeout)) {
            throw RuntimeException("Expected text '$text' not visible after ${timeout}ms")
        }
    }

    fun swipeRight() {
        val device = getDevice()
        val width = device.displayWidth
        val height = device.displayHeight
        // Swipe from left edge (10px) to middle
        device.swipe(10, height / 2, width / 2, height / 2, 20)
    }
    
    fun clickText(text: String) {
        val device = getDevice()
        // Wait for it to be clickable/visible first
        if(waitForText(text, 5000)) {
            val obj = device.findObject(By.textContains(text))
            obj.click()
        } else {
            throw RuntimeException("Could not find text to click: $text")
        }
    }
    
    fun enterTextByPlaceholder(placeholder: String, text: String) {
        val device = getDevice()
        // In RN, placeholders often appear as text nodes. 
        // We find the node with the placeholder text, click it to focus, then type.
        val obj = device.findObject(By.text(placeholder))
        if (obj != null) {
            obj.click()
            // Clear existing text if any? 
            // obj.clear() // RN inputs usually clear on empty set but let's just type.
            // Using logic to clear might be tricky. setText usually replaces.
            obj.text = text
        } else {
            // Fallback: Try regex or contains
             val objHas = device.findObject(By.textContains(placeholder))
             if(objHas != null) {
                 objHas.click()
                 objHas.text = text
             } else {
                 throw RuntimeException("Could not find input with placeholder: $placeholder")
             }
        }
    }
}
