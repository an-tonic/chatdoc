package com.chatdoc_v1

import android.content.Intent
import android.net.Uri
import android.util.Log
import android.os.Bundle
import android.os.Build
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.ReactContext
import com.facebook.react.ReactInstanceManager
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactApplication
import android.os.Handler
import android.os.Looper


class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "ChatDOC_v1"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)


    override fun onNewIntent(intent: Intent?){
        super.onNewIntent(intent)
        intent?.let {
                setIntent(it)
            }
    }

}