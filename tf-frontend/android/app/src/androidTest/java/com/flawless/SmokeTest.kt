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
class SmokeTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    private lateinit var device: UiDevice

    @Before
    fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
    }

    @Test
    fun appLaunches_andLoadsReactContext() {
        // Wait for package to be active
        val packageName = InstrumentationRegistry.getInstrumentation().targetContext.packageName
        device.wait(Until.hasObject(By.pkg(packageName).depth(0)), 10000)

        // Wait for specific React Native UI element (e.g., Login Header or Home)
        // Using UIAutomator to wait safely
        val loginTextFound = device.wait(Until.hasObject(By.textContains("Login")), 10000)
        
        // Assert that we found something meaningful
        // If login text isn't found, maybe we are logged in? Check for Home element?
        if (!loginTextFound) {
            // Check for Home screen text if Login not found (Auto-login scenario)
            val homeFound = device.wait(Until.hasObject(By.textContains("Flawless")), 5000) 
            // Assert at least one main entry point is visible
            assert(homeFound || loginTextFound) { "App did not load Login or Home screen within timeout" }
        }
    }
}
