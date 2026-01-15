package com.example.log3900_212

import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.annotation.RequiresApi
import androidx.compose.runtime.Composable
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        SocketHandler.setSocket()
        SocketHandler.establishConnection()
        lifecycleScope.launch {
            delay(2000)
            Log.d(
                "MainActivity",
                "WebSocket Connection Status: ${SocketHandler.getSocket().connected()}"
            )
        }
        setContent {
            MainScreen()
        }

    }
}


@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    SocketEventHandler.setNavController(navController)
    SocketEventHandler.initialize()
    NavHost(
        navController = navController,
        startDestination = "login_screen",
    ) {
        composable("login_screen") { LoginScreen(navController) }
        composable("main_screen") { HomeScreen(navController) }
        composable("chat_screen") { ChatScreen(navController) }
        composable("register_screen") { RegisterScreen(navController) }
    }
}
