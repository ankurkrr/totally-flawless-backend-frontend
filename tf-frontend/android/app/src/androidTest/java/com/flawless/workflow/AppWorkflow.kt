package com.flawless.workflow

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.replaceText
import androidx.test.espresso.matcher.ViewMatchers.withTagValue
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import org.hamcrest.CoreMatchers.`is`
import org.hamcrest.Matcher

object AppWorkflow {

    enum class Role {
        CLIENT,
        ARTIST,
        GUEST
    }

    // Matcher Helper
    private fun withNativeID(id: String): Matcher<View> {
        return withTagValue(`is`(id))
    }

    // Wait Helper
    private fun waitForElement(device: UiDevice, accessibilityId: String) {
        device.wait(Until.hasObject(By.desc(accessibilityId)), 15000)
    }

    fun navigateToAuthLink(device: UiDevice) {
        // 1. FAST CHECK: Already on AuthLink?
        if (device.hasObject(By.desc("loginAsClient"))) return

        // 2. Wait for Slider to load (Button is always present)
        device.wait(Until.hasObject(By.desc("getStartedButton")), 10000)

        // 3. Robust Click-Through Strategy
        // The button acts as "Learn More" (Scrolls Slide) on indices 0-2
        // AND acts as "Get Started" (Navigates) on index 3.
        // We simply click it repeatedly until we leave the screen.
        for (i in 0..5) {
            // Check if we have successfully navigated away
            if (device.hasObject(By.desc("loginAsClient"))) return

            // If the button is still there, click it to Advance or Navigate
            if (device.hasObject(By.desc("getStartedButton"))) {
                device.findObject(By.desc("getStartedButton"))?.click()
                // Wait for scroll animation (usually ~500ms) or navigation (~1.5s)
                Thread.sleep(1500)
            }
        }

        // 4. Final Wait for Navigation
        // Ensure we catch the login screen if the last click triggered the transition
        device.wait(Until.hasObject(By.desc("loginAsClient")), 15000)
    }

    fun selectRole(device: UiDevice, role: Role) {
        navigateToAuthLink(device)
        when (role) {
            Role.CLIENT -> {
                waitForElement(device, "loginAsClient")
                onView(withNativeID("loginAsClient")).perform(click())
                waitForElement(device, "phoneInput") // Wait for Login Screen
            }
            Role.ARTIST -> {
                waitForElement(device, "loginAsArtist")
                onView(withNativeID("loginAsArtist")).perform(click())
                waitForElement(device, "phoneInput") // Wait for Login Screen
            }
            Role.GUEST -> {
                waitForElement(device, "exploreAsGuest")
                onView(withNativeID("exploreAsGuest")).perform(click())
                waitForElement(device, "homeHeader") // Wait for Home
            }
        }
    }

    fun login(device: UiDevice, role: Role, phone: String, otp: String) {
        selectRole(device, role)

        // Login Screen
        waitForElement(device, "phoneInput")
        onView(withNativeID("phoneInput")).perform(replaceText(phone))
        onView(withNativeID("loginButton")).perform(click())

        // OTP Screen
        waitForElement(device, "otpInput0")
        onView(withNativeID("otpInput0")).perform(replaceText(otp[0].toString()))
        onView(withNativeID("otpInput1")).perform(replaceText(otp[1].toString()))
        onView(withNativeID("otpInput2")).perform(replaceText(otp[2].toString()))
        onView(withNativeID("otpInput3")).perform(replaceText(otp[3].toString()))
        
        onView(withNativeID("verifyButton")).perform(click())

        // Post-Login Wait
        // Determine destination based on role
        val destinationId = if (role == Role.ARTIST) "artistUpcoming" else "homeHeader"
        // Note: For new users, this might go to Register/ArtistLogin, but we assume existing user flow for standard tests
        // Adjust if testing registration.
        waitForElement(device, destinationId)
    }
}
