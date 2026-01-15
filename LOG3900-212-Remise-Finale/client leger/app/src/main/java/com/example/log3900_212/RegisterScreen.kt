package com.example.log3900_212

import android.util.Log
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import org.json.JSONObject

val DisneyFont = FontFamily(Font(R.font.waltograph))

@Suppress("ktlint:standard:function-naming")
@Composable
fun RegisterScreen(navController: NavController) {
    var email by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordCheck by remember { mutableStateOf("") }
    var selectedAvatarIndex by remember { mutableIntStateOf(0) }
    var hasAttemptedSubmit by remember { mutableStateOf(false) }
    val mSocket = remember { SocketHandler.getSocket() }
    var isRegistering by remember { mutableStateOf(false) }

    val avatars =
        listOf(
            R.drawable.ariel,
            R.drawable.stitch,
            R.drawable.genie,
            R.drawable.cinderella,
            R.drawable.donald_duck,
            R.drawable.jasmine,
            R.drawable.mickey_mouse,
            R.drawable.snow_white,
        )
    val hasUpperCase = password.any { it.isUpperCase() }
    val hasNumber = password.any { it.isDigit() }
    val hasSpecialChar = password.any { "!@#$%^&*()-_=+[]{};:'\",.<>?/".contains(it) }
    val isLengthValid = password.length >= 6
    val isPasswordSame = passwordCheck == password

    // TODO
    // Utiliser serveur pour voir si Username valide
    val isUsernameValid = username.isNotBlank() && username.length <= 25

    var isUsernameAvailable by remember { mutableStateOf(true) }


    // TODO
    // Valider le courriel
    val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$".toRegex()
    val isEmailValid = email.isNotBlank() && email.matches(emailRegex)
    var isEmailAvailable by remember { mutableStateOf(true) }
    val isFormValid =
        isUsernameValid && isEmailValid && isLengthValid && hasNumber && hasUpperCase && hasSpecialChar && isPasswordSame && isEmailAvailable && isUsernameAvailable

    LaunchedEffect(Unit) {
        mSocket.connect()

        if (UserHandler.userId != "") {
            navController.navigate("chat_screen")
        }

        mSocket.on("usernameAvailability") { args ->
            Log.d("TAG", "username pas dispo")
            val isAvailable = args[0] as Boolean
            isUsernameAvailable = isAvailable
        }
        mSocket.on("emailAvailability") { args ->
            Log.d("TAG", "EMAIL pas dispo")
            val isAvailable = args[0] as Boolean
            isEmailAvailable = isAvailable
        }
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
                .background(Color.White, shape = RoundedCornerShape(16.dp))
                .padding(95.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "Enregistrement",
                fontSize = 30.sp,
                fontFamily = DisneyFont,
                color = Color(0xFF005AAC)
            )

            Spacer(modifier = Modifier.height(32.dp))

            OutlinedTextField(
                value = email,
                onValueChange = {
                    if (it.length <= 100) {
                        email = it
                    }
                    hasAttemptedSubmit = true
                    if (isEmailValid) {
                        Log.d("SOCKET", "📤 Vérification du email: $email")
                        mSocket.emit("isEmailAvailable", email)
                    }
                },
                label = { Text("Courriel", fontFamily = DisneyFont) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(8.dp))

            Box(modifier = Modifier.height(20.dp)) {
                if (hasAttemptedSubmit && (!isEmailValid || !isEmailAvailable)) {
                    if (!isEmailValid) {
                        Log.d("tag", "email pas valide")
                        Text(
                            "Courriel est invalide",
                            color = Color(0xFFFF3D00)
                        )
                    } else {
                        Log.d("tag", "email pas dispo")
                        Text(
                            "Cet email est déjà utilisé",
                            color = Color(0xFFFF3D00)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = username,
                onValueChange = {
                    if (it.length <= 25) { // ✅ Allow deletion & prevent overflow
                        username = it
                    }
                    hasAttemptedSubmit = true
                    if (isUsernameValid) {
                        Log.d("SOCKET", "📤 Vérification du username: $username")
                        mSocket.emit("isUsernameAvailable", username)
                    }
                },
                label = {
                    Text(
                        "Nom d'utilisateur ${username.length}/25",
                        fontFamily = DisneyFont
                    )
                },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(8.dp))

            Box(modifier = Modifier.height(20.dp)) {
                if (hasAttemptedSubmit && (!isUsernameValid || !isUsernameAvailable)) {
                    if (!isUsernameValid) {
                        Text(
                            "Nom d'utilisateur est invalide",
                            color = Color(0xFFFF3D00),
                        )
                    } else {
                        Text(
                            "Ce pseudonyme est déjà pris",
                            color = Color(0xFFFF3D00),
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { if (it.length <= 50) password = it },
                label = { Text("Mot de passe", fontFamily = DisneyFont) },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(8.dp))

            Column(
                modifier =
                Modifier
                    .padding(start = 8.dp, top = 8.dp)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.Start,
            ) {
                PasswordRequirement("Au moins une lettre majuscule", hasUpperCase)
                PasswordRequirement("Au moins un chiffre", hasNumber)
                PasswordRequirement("Au moins un caractère spéciale (!@#\$%^&*)", hasSpecialChar)
                PasswordRequirement("Au moins 6 caractères de longueurs", isLengthValid)
            }

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = passwordCheck,
                onValueChange = { if (it.length <= 50) passwordCheck = it },
                label = {
                    Text(
                        "Reécrire mot de passe",
                        fontFamily = DisneyFont,
                    )
                },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(8.dp))

            Box(modifier = Modifier.height(20.dp)) {
                if (!isPasswordSame) {
                    Text(
                        "Mot de passe n'est pas le même",
                        color = Color(0xFFFF3D00)
                    )
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            Text(
                "Choisir un avatar",
                fontSize = 24.sp,
                fontFamily = DisneyFont,
                color = Color(0xFF002D62),
            )

            Spacer(modifier = Modifier.height(16.dp))

            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                itemsIndexed(avatars) { index, avatar ->
                    Box(
                        modifier =
                        Modifier
                            .size(90.dp)
                            .padding(8.dp)
                            .clip(CircleShape)
                            .border(
                                width = if (selectedAvatarIndex == index) 4.dp else 0.dp,
                                color = if (selectedAvatarIndex == index) Color.Yellow else Color.Transparent,
                                shape = CircleShape,
                            )
                            .clickable { selectedAvatarIndex = index },
                    ) {
                        Image(
                            painter = painterResource(id = avatar),
                            contentDescription = "Avatar $index",
                            modifier = Modifier.fillMaxSize(),
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                "← Glisser →",
                fontSize = 14.sp,
                fontFamily = DisneyFont,
                color = Color.Gray,
            )

            Spacer(modifier = Modifier.height(60.dp))

            Button(
                onClick = {
                    isRegistering = true
                    UserHandler.savePlayerInfo(
                        username,
                        (selectedAvatarIndex + 1).toString(),
                        email,
                        password
                    )
                    UserHandler.registerUser { message ->
                        if (message == "Votre compte a été sauvegardé avec succès!") {
                            val session = JSONObject().apply {
                                put("username", username)
                                put("password", password)
                            }
                            UserHandler.user.username = username
                            UserHandler.user.password = password
                            mSocket.emit("login", session)
                        }
                        isRegistering = false
                    }
                },
                enabled = isFormValid && !isRegistering,
                modifier = Modifier.fillMaxWidth(),
                colors =
                ButtonDefaults.buttonColors(
                    containerColor = if (isFormValid) Color(0xFF005AAC) else Color(0xFFC0C0C0),
                    contentColor = Color.White,
                ),
            ) {
                if (isRegistering) {
                    CircularProgressIndicator(
                        color = Color.White,
                        modifier = Modifier.size(24.dp) // ✅ Show loading inside button
                    )
                } else {
                    Text(
                        "Enregistrer",
                        fontSize = 30.sp,
                        fontFamily = DisneyFont,
                        color = Color(0xFFFFD700)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun PasswordRequirement(
    requirement: String,
    isMet: Boolean,
) {
    Row(modifier = Modifier.padding(4.dp)) {
        Text(
            text = if (isMet) "✅ $requirement" else "❌ $requirement",
            fontSize = 14.sp,
            color = if (isMet) Color(0xFF008000) else Color(0xFFFF3D00),
        )
    }
}
