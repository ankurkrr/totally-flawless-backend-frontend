#!/bin/bash

# CI Setup Script for Android Instrumentation Tests

echo "Disabling System Animations..."
adb shell settings put global window_animation_scale 0.0
adb shell settings put global transition_animation_scale 0.0
adb shell settings put global animator_duration_scale 0.0

echo "Waking Device..."
adb shell input keyevent KEYCODE_WAKEUP
adb shell input keyevent 82 # KEYCODE_MENU/UNLOCK

echo "Setting Orientation to Portrait..."
# 0 = Service, 1 = Portait, 2 = Landscape? No, 0=Portrait typically. 
# Better to user accelerometer rotation
adb shell content insert --uri content://settings/system --bind name:s:accelerometer_rotation --bind value:i:0
adb shell content insert --uri content://settings/system --bind name:s:user_rotation --bind value:i:0

echo "Device Hardening Complete."
