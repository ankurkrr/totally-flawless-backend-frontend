package com.flawless.base

import android.content.Intent
import androidx.test.core.app.ActivityScenario
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withTagValue
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import com.flawless.MainActivity
import org.hamcrest.CoreMatchers.`is`
import org.hamcrest.Matcher
import android.view.View
import org.junit.After
import org.junit.Before

open class BaseTest {

    protected lateinit var device: UiDevice
    protected lateinit var scenario: ActivityScenario<MainActivity>

    @Before
    open fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        
        // Launch Activity
        val intent = Intent(InstrumentationRegistry.getInstrumentation().targetContext, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK)
        scenario = ActivityScenario.launch(intent)
        
        // Wait for React Native to initialize
        waitForRN()
    }

    @After
    open fun tearDown() {
        scenario.close()
    }

    /**
     * Waits for the React Native view hierarchy to be populated.
     */
    /**
     * Waits for the React Native view hierarchy to be populated.
     */
    protected fun waitForRN(timeout: Long = 15000) {
        // We wait for EITHER the Slider (fresh start) OR AuthLink (reset start)
        // logic handled inside AppWorkflow mostly, but here we just ensure *something* is visible
        val visible = device.wait(Until.hasObject(By.desc("getStartedButton")), timeout) || 
                      device.wait(Until.hasObject(By.desc("loginAsClient")), 2000)
    }

    /**
     * Navigates to the Client Login screen (Phone Input)
     */
    protected fun navigateToClientLogin() {
        com.flawless.workflow.AppWorkflow.selectRole(
            device,
            com.flawless.workflow.AppWorkflow.Role.CLIENT
        )
    }

    /**
     * Performs full login to Home screen as Client
     */
    protected fun loginAsClient() {
        com.flawless.workflow.AppWorkflow.login(
            device,
            com.flawless.workflow.AppWorkflow.Role.CLIENT,
            "9999999999",
            "1111"
        )
    }
    
    // Strict NativeID Matcher Helper
    protected fun withNativeID(id: String): Matcher<View> {
        return withTagValue(`is`(id))
    }
    
    // Hybrid Sync Helper
    protected fun waitForScreen(nativeID: String, timeout: Long = 15000) {
         device.wait(Until.hasObject(By.desc(nativeID)), timeout)
    }

    protected fun waitForElement(accessibilityId: String, timeout: Long = 10000) {
         waitForScreen(accessibilityId, timeout)
    }
}
