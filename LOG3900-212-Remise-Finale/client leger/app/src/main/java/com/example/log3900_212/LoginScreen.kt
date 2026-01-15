package com.example.log3900_212

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

data class UserInfo(
    var id: String,
    var username: String,
    var avatar: String,
    var email: String
)


@Composable
fun LoginScreen(navController: NavController) {
    val mSocket = remember { SocketHandler.getSocket() }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }
    val isFormValid = username.isNotBlank() && password.isNotBlank()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        if (UserHandler.userId != "") {
            navController.navigate("chat_screen")
        }
        mSocket.on("authenticationError") { args ->
            Log.d("DEBUG", "🔥 Received args: ${args.toList()}")

            try {
                val error = args[0] as JSONObject
                coroutineScope.launch(Dispatchers.Main) {
                    errorMessage = error.getString("message")
                }
            } catch (e: Exception) {
                Log.e("DEBUG", "Failed to parse: ${e.stackTraceToString()}")
            }
        }

        /*mSocket.on("connected") { args ->
            Log.d("DEBUG", "🔥 Received args: ${args.toList()}")

            try {
                val jsonObject = args[0] as JSONObject // Extraction du JSON
                val userInfo = UserInfo(
                    id = jsonObject.getString("id"),
                    email = jsonObject.getString("email"),
                    username = jsonObject.getString("username"),
                    avatar = jsonObject.getString("avatar")
                )
                coroutineScope.launch(Dispatchers.Main) {
                    userId = userInfo.id
                    user.username = userInfo.username
                    user.email = userInfo.email
                    user.avatar = userInfo.avatar
                    user.password = user.password
                    Log.d("TAG", "les infos du joueur du handler ${user}")

                    navController.navigate("chat_screen")
                }
                Log.d("TAG", "le joueur sest connecté")
            } catch (e: Exception) {
                Log.e("DEBUG", "Failed to parse: ${e.stackTraceToString()}")
            }
        }*/

    }
    Box(
        modifier =
        Modifier
            .fillMaxHeight()
            .background(Color(0xFF005AAC)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier =
            Modifier
                .padding(95.dp)
                .background(Color.White, shape = RoundedCornerShape(24.dp))
                .padding(95.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "BIENVENUE À POLYQUIZ",
                fontSize = 25.sp,
                fontFamily = DisneyFont,
                color = Color(0xFF005AAC),
                modifier = Modifier.offset(y = (-45).dp),
            )

            Text("Connexion", fontSize = 30.sp, fontFamily = DisneyFont, color = Color(0xFF005AAC))

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = username,
                onValueChange = { if (it.length <= 25) username = it },
                label = { Text("Nom d'utilisateur", fontFamily = DisneyFont) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { if (it.length <= 50) password = it },
                label = { Text("Mot de passe", fontFamily = DisneyFont) },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (errorMessage.isNotEmpty()) {
                Text(
                    text = errorMessage,
                    color = Color.Red,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(8.dp)
                )
            }

            Button(
                onClick = {
                    val session = JSONObject().apply {
                        put("username", username)
                        put("password", password)
                    }

                    UserHandler.user.username = username
                    UserHandler.user.password = password
                    mSocket.emit("login", session)
                },
                enabled = isFormValid,
                modifier = Modifier.fillMaxWidth(),
                colors =
                ButtonDefaults.buttonColors(
                    containerColor = if (isFormValid) Color(0xFF005AAC) else Color(0xFFC0C0C0),
                    contentColor = Color.White,
                ),
            ) {
                Text("Connexion", fontFamily = DisneyFont, fontSize = 18.sp, color = Color.White)
            }

            Spacer(modifier = Modifier.height(8.dp))

            TextButton(
                onClick = { navController.navigate("register_screen") },
            ) {
                Text(
                    "Pas de compte? Enregistre-toi",
                    fontFamily = DisneyFont,
                    fontSize = 16.sp,
                    color = Color(0xFF005AAC),
                )
            }
        }
    }
}
