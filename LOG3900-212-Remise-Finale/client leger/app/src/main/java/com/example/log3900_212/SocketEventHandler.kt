package com.example.log3900_212
import android.os.Handler
import android.os.Looper
import androidx.compose.runtime.mutableStateOf
import androidx.navigation.NavController
import android.util.Log
import org.json.JSONObject

object SocketEventHandler {
    private val _navController = mutableStateOf<NavController?>(null)
    private val mainHandler = Handler(Looper.getMainLooper())
    var user = mutableStateOf(UserHandler.user)
    var userId = mutableStateOf(UserHandler.userId)
    fun setNavController(navController: NavController) {
        _navController.value = navController
    }

    fun initialize() {
        val mSocket = SocketHandler.getSocket()

        mSocket.on("disconnected") {
            Log.d("DEBUG", "joueur deconnecté")
            UserHandler.userId = ""
            UserHandler.user = User("", "", "", "")
            mainHandler.post {
                _navController.value?.let {
                    it.navigate("login_screen") {
                        popUpTo("chat_screen") { inclusive = true }
                    }
                    Log.d("SOCKET", "🚀 Navigation vers login_screen réussie")
                } ?: Log.e("SOCKET", "❌ Impossible de naviguer, navController est null")
            }


        }

        mSocket.on("connected") { args ->
            Log.d("SOCKET", "🔥 Received args: ${args.toList()}")
            val currentRoute = _navController.value?.currentBackStackEntry?.destination?.route
            Log.d("NAVIGATION", "Actuellement sur : $currentRoute")
            try {
                val jsonObject = args[0] as JSONObject
                val userInfo = UserInfo(
                    id = jsonObject.getString("id"),
                    email = jsonObject.getString("email"),
                    username = jsonObject.getString("username"),
                    avatar = jsonObject.getString("avatar")
                )
                UserHandler.userId = userInfo.id
                UserHandler.user.avatar = userInfo.avatar
                UserHandler.user.email = userInfo.email
                mainHandler.post {
                    _navController.value?.let {
                        it.navigate("chat_screen") {
                            popUpTo("register_screen") { inclusive = true }
                        }
                        Log.d("SOCKET", "🚀 Navigation vers chat_screen réussie")
                    } ?: Log.e("SOCKET", "❌ Impossible de naviguer, navController est null")
                }
            } catch (e: Exception) {
                Log.e("SOCKET", "Failed to parse: ${e.stackTraceToString()}")
            }
        }
    }
}
