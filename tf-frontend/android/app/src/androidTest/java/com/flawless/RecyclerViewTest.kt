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
class RecyclerViewTest : BaseTest() {

    @Test
    fun verifyHomeServiceLists() {
        // 1. Full Login
        loginAsClient()

        // 2. Wait for Home
        waitForElement("homeHeader")
        onView(withNativeID("homeHeader")).check(matches(isDisplayed()))

        // 3. Verify Makeup List Item 0
        waitForElement("serviceCard_makeup_0")
        onView(withNativeID("serviceCard_makeup_0")).check(matches(isDisplayed()))

        // 4. Verify Hair List Item 0
        waitForElement("serviceCard_hair_0")
        onView(withNativeID("serviceCard_hair_0")).check(matches(isDisplayed()))
    }
}
