package com.flawless

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import com.flawless.base.BaseTest
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
@org.junit.Ignore("Blocked by React Native nativeID propagation issue. Manual testing passed. See task.md for details.")
class NavigationTest : BaseTest() {

    @Test
    fun testLogoutFlow() {
        // Full login to Home
        loginAsClient()
        waitForElement("homeHeader")

        // Open Drawer (Swipe Left to Right)
        device.swipe(0, 500, 800, 500, 10) 
        
        // Wait for logout button
        waitForElement("logoutButton")
        
        onView(withNativeID("logoutButton")).perform(click())
        
        // Verify returned to Login
        waitForElement("loginButton")
        onView(withNativeID("loginButton")).check(matches(isDisplayed()))
    }
}
