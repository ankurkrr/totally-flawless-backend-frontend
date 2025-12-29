package com.flawless

import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class PermissionsTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    private lateinit var device: UiDevice

    @Before
    fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
    }

    @Test
    fun handleSystemPermissions() {
        // Wait for potential permission dialog
        // This test monitors for permission dialogs and accepts them.
        // We use wait with a timeout. If it doesn't appear, that's fine too (permission might be granted already)
        
        // Pattern matches "Allow", "While using the app", "Only this time"
        val permissionPattern = java.util.regex.Pattern.compile("(?i)Allow|While using the app|Only this time")
        
        // Wait up to 5 seconds for a permission dialog
        val allowButton = device.wait(Until.findObject(By.text(permissionPattern)), 5000)
        
        if (allowButton != null) {
            allowButton.click()
        }
    }
}
