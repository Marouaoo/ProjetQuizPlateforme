package com.example.log3900_212

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController

@Composable
fun HomeScreen(navController: NavController) {
    Box(modifier = Modifier.fillMaxSize()) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = 200.dp),
                contentAlignment = Alignment.Center
            ) {
                TitleText()
            }
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                QuizLogo()
            }
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Column {
                    JoinButton()
                    Spacer(modifier = Modifier.padding(5.dp))
                    CreateButton()
                    Spacer(modifier = Modifier.padding(5.dp))
                    AdminButton(navController)
                }
            }
        }
    }
}


@Composable
fun TitleText() {
    Text(
        text = "QUIZZLER",
        modifier = Modifier.offset(y = (-100).dp),
        style = TextStyle(
            fontSize = 125.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Color(0xff003f91),
            fontFamily = FontFamily.SansSerif
        )
    )
}

@Composable
fun QuizLogo() {
    Image(
        painter = painterResource(id = R.drawable.backgroundquizzler),
        contentDescription = null,
    )
    Image(
        painter = painterResource(id = R.drawable.ic_launcher_foreground),
        contentDescription = "AppLogo",
        modifier = Modifier.size(500.dp)
    )
}

@Composable
fun JoinButton() {
    Button(
        onClick = {},
        border = BorderStroke(width = 3.dp, color = Color.Black),
        modifier = Modifier.size(width = 350.dp, height = 50.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xff003f91),
        )
    ) {
        Text(
            "Joindre une partie",
            style = TextStyle(fontSize = 30.sp),
            fontWeight = FontWeight.ExtraBold
        )

    }
}

@Composable
fun CreateButton() {
    Button(
        onClick = {},
        modifier = Modifier.size(width = 350.dp, height = 50.dp),
        border = BorderStroke(width = 3.dp, color = Color.Black),

        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xff003f91),
        )
    ) {
        Text(
            "Créer une partie",
            style = TextStyle(fontSize = 30.sp),
            fontWeight = FontWeight.ExtraBold
        )
    }
}

@Composable
fun AdminButton(navController: NavController) {
    Button(
        onClick = { navController.navigate("chat_screen") },
        modifier = Modifier.size(width = 350.dp, height = 50.dp),
        border = BorderStroke(width = 3.dp, color = Color.Black),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xff003f91),
        )

    ) {
        Text(
            "Administrer les jeux",
            style = TextStyle(fontSize = 30.sp),
            fontWeight = FontWeight.ExtraBold
        )
    }
}

