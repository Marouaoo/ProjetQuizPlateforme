package com.example.log3900_212

import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.time.Instant
import java.util.Date
import java.util.Locale

data class ChatMessage(
    val avatar: String,
    val author: String,
    val text: String,
    val timestamp: Date,
    val channelId: String,
)

data class ChatData(
    val channelId: String,
    val message: ChatMessage
)

@Composable
fun ChatBubble(message: ChatMessage) {
    val isCurrentUser = message.author == UserHandler.user.username
    val formattedTime = remember(message.timestamp) {
        SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(message.timestamp)
    }
    Row(
        modifier = Modifier
            .fillMaxWidth(),
        horizontalArrangement = if (isCurrentUser) Arrangement.End else Arrangement.Start
    ) {
        if (!isCurrentUser) {
            AvatarView(message.avatar)
            Spacer(modifier = Modifier.width(8.dp))
        }


        Column {
            Text(
                text = message.author,
                fontSize = 14.sp,
                color = Color.White,
                modifier = Modifier.align(if (isCurrentUser) Alignment.End else Alignment.Start)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .background(
                        if (isCurrentUser) Color(0xFF002D62) else Color.Gray,
                        shape = RoundedCornerShape(16.dp)
                    )
                    .padding(12.dp)
            ) {

                Column {
                    Text(
                        text = message.text,
                        fontSize = 18.sp,
                        color = Color.White
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = formattedTime,
                fontSize = 12.sp,
                color = Color.LightGray,
                modifier = Modifier.align(if (isCurrentUser) Alignment.End else Alignment.Start)
            )
        }


        if (isCurrentUser) {
            Spacer(modifier = Modifier.width(8.dp))
            AvatarView(message.avatar)
        }
    }
    Spacer(modifier = Modifier.height(8.dp))
}

@Composable
fun AvatarView(avatarIndex: String) {
    val avatarResourceMap = listOf(
        R.drawable.ariel,
        R.drawable.stitch,
        R.drawable.genie,
        R.drawable.cinderella,
        R.drawable.donald_duck,
        R.drawable.jasmine,
        R.drawable.mickey_mouse,
        R.drawable.snow_white,
    )

    val avatarResId = avatarIndex.toIntOrNull()?.let { index ->
        avatarResourceMap.getOrNull(index - 1)
    }


    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(Color.LightGray)
    ) {
        if (avatarResId != null) {
            Image(
                painter = painterResource(id = avatarResId),
                contentDescription = "Avatar",
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Text(
                text = "❓",
                color = Color.White
            )
        }
    }
}

@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun ChatScreen(navController: NavController) {
    val mSocket = remember { SocketHandler.getSocket() }
    var newMessage by remember { mutableStateOf("") }
    val messages = remember { mutableStateListOf<ChatMessage>() }
    val listState = rememberLazyListState()

    val maxLength = 200

    suspend fun scrollToBottom() {
        if (messages.isNotEmpty()) {
            listState.scrollToItem(messages.size - 1)
        }
    }
    LaunchedEffect(messages.size) {
        scrollToBottom()
    }
    LaunchedEffect(Unit) {
        mSocket.connect()
        if (UserHandler.userId == "") {
            Log.d("TAG", "LE USER EST PAS CONNECTÉ REDIRIGE LE")
            navController.navigate("login_screen")
        } else {
            Log.d("TAG", "LE USER EST AUTHENTIFIÉ ${UserHandler.userId}")
            Log.d("TAG", "LE USER EST AUTHENTIFIÉ 2 ${UserHandler.user}")
            mSocket.emit("joinChatRoom", "global")
            Log.d("SOCKET", "🎧 Écoute de previousMessages activée...")
            mSocket.on("previousMessages") { args ->
                Log.d("DEBUG", "📜 Received previousMessages: ${args.toList()}")
                try {
                    val messagesArray = args[0] as? JSONArray ?: return@on

                    val previousMessagesList = mutableListOf<ChatMessage>()

                    for (i in 0 until messagesArray.length()) {
                        val jsonObject = messagesArray.getJSONObject(i)
                        Log.d("CHAT", "THE JSON OBJECT IN PREVIOUS...: $jsonObject")
                        val timestampLong = try {
                            val timestampStr = jsonObject.optString("timestamp", "")
                            if (timestampStr.isNotEmpty()) {
                                Instant.parse(timestampStr).toEpochMilli()
                            } else {
                                jsonObject.optLong("timestamp", System.currentTimeMillis())
                            }
                        } catch (e: Exception) {
                            Log.e("CHAT", "Error parsing timestamp: ${e.message}")
                            System.currentTimeMillis()
                        }

                        val chatMessage = ChatMessage(
                            avatar = jsonObject.optString("avatar", "default_avatar"),
                            author = jsonObject.optString("author", "Inconnu"),
                            text = jsonObject.optString("text", "Message vide"),
                            timestamp = Date(
                                jsonObject.optLong("timestamp", timestampLong)
                            ),
                            channelId = jsonObject.optString("channelId", "global")
                        )
                        previousMessagesList.add(chatMessage)
                        Log.d("CHAT", "THE MESSAGE LIST...: $chatMessage")
                    }
                    messages.clear()
                    // 🔥 Ajouter les anciens messages à la liste des messages
                    messages.addAll(previousMessagesList)
                } catch (e: Exception) {
                    Log.e("DEBUG", "❌ Erreur lors du parsing du message: ${e.stackTraceToString()}")
                }

            }
            mSocket.on("newMessage") { args ->
                Log.d("DEBUG", "🔥 Received MESSAGES: ${args.toList()}")
                try {
                    val jsonObject = args[0] as JSONObject
                    Log.d("DEBUG", "📜 Message JSON reçu: $jsonObject")
                    val avatar = jsonObject.optString("avatar", "default_avatar")
                    val author = jsonObject.optString("author", "Inconnu")
                    val text = jsonObject.optString("text", "Message vide")
                    val timestamp = jsonObject.optLong("timestamp", System.currentTimeMillis())
                    val channelId = jsonObject.optString("channelId", "global")
                    val chatMessage = ChatMessage(
                        avatar = avatar,
                        author = author,
                        text = text,
                        timestamp = Date(timestamp),
                        channelId = channelId
                    )
                    Log.d("MESSAGE", "LE NOUVEAU MESSAGE $chatMessage")
                    messages.add(chatMessage)
                    Log.d("MESSAGE", "LES MESSAGE $messages")
                } catch (e: Exception) {
                    Log.e("DEBUG", "❌ Erreur lors du parsing du message: ${e.stackTraceToString()}")
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF005AAC))
            .padding(16.dp)
            .imePadding()
            .navigationBarsPadding(),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // 🔥 Bouton Logout en haut de l'écran
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            Button(
                onClick = {
                    mSocket.emit("logout")
                },
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text("Déconnexion", color = Color.White, fontFamily = DisneyFont)
            }
        }

        fun sendMessage() {
            if (newMessage.isNotBlank()) {
                val message = ChatMessage(
                    avatar = UserHandler.user.avatar,
                    author = UserHandler.user.username,
                    text = newMessage,
                    timestamp = Date(),
                    channelId = "global"
                )

                val chatData = ChatData(
                    channelId = "global",
                    message = message
                )

                val jsonObject = JSONObject().apply {
                    put("channelId", chatData.channelId)
                    put("message", JSONObject().apply {
                        put("avatar", message.avatar)
                        put("author", message.author)
                        put("text", message.text)
                        put("timestamp", message.timestamp.time)
                        put("channelId", message.channelId)
                    })
                }

                mSocket.emit("message", jsonObject)

                Log.d("EMIT", "🔥 Sending message: $message")

                newMessage = ""
            }
        }



        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF005AAC))
                .padding(16.dp)
                .imePadding()
                .navigationBarsPadding(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
            ) {
                items(messages.sortedBy { it.timestamp.time }) { message ->
                    ChatBubble(message)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                BasicTextField(
                    value = newMessage,
                    onValueChange = { if (it.length <= maxLength) newMessage = it },
                    modifier = Modifier
                        .weight(1f)
                        .background(Color.White, RoundedCornerShape(16.dp))
                        .padding(12.dp),
                    keyboardOptions = KeyboardOptions.Default.copy(
                        imeAction = ImeAction.Send
                    ),
                    keyboardActions = KeyboardActions(
                        onSend = {
                            sendMessage()
                        }
                    )
                )

                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = {
                        sendMessage()
                    },
                    modifier = Modifier.clip(RoundedCornerShape(16.dp))
                ) {
                    Text(
                        "Envoyer",
                        fontFamily = DisneyFont,
                        fontSize = 18.sp,
                        color = Color(0xFFFFD700)
                    )
                    Text(
                        text = "${newMessage.length} / $maxLength",
                        fontSize = 14.sp,
                        color = Color.LightGray,
                    )

                }
            }
        }
    }
}
