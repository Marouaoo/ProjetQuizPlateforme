package com.example.log3900_212

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import org.json.JSONObject

data class User(
    var username: String,
    var avatar: String,
    var email: String,
    var password: String
)

object UserHandler {
    var user: User = User("", "", "", "")
    var userId: String = ""

    fun savePlayerInfo(username: String, avatar: String, email: String, password: String) {
        user = User(username, avatar, email, password)
        println("Player info saved: $username, $avatar, $email")
    }

    fun getPlayerInfo(): User {
        return user
    }

    fun clearPlayerInfo() {
        user.username = ""
        user.email = ""
        user.avatar = ""
        user.password = ""
        userId = ""
        println("Player info cleared")
    }

    fun registerUser(onResult: (String) -> Unit) {
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject().apply {
                    put("email", user.email)
                    put("username", user.username)
                    put("password", user.password)
                    put("avatar", user.avatar)
                }

                val client = OkHttpClient()
                val body =
                    RequestBody.create("application/json".toMediaTypeOrNull(), json.toString())
                val request = Request.Builder()
                    .url("http://ec2-3-99-191-110.ca-central-1.compute.amazonaws.com:3000/api/session/register") // Remplace par ton URL réelle
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()

                val resultMessage = if (response.isSuccessful) {
                    Log.d("TAG", "la creation de compte a réussi")
                    "Votre compte a été sauvegardé avec succès!"
                } else {
                    Log.d("TAG", "la creation de compte a échoueeeeeeee")
                    val errorObj = JSONObject(response.body?.string() ?: "{}")
                    errorObj.optString(
                        "message",
                        "Erreur inattendue, veuillez réessayer plus tard..."
                    )
                }

                onResult(resultMessage)
            } catch (e: Exception) {
                onResult("Erreur inconnue, veuillez réessayer plus tard...")
            }
        }
    }
}
