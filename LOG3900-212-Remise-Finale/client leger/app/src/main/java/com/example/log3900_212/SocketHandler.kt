package com.example.log3900_212

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

object SocketHandler {

    lateinit var mSocket: Socket

    @Synchronized
    fun setSocket() {
        try {
            val options = IO.Options()
            options.path = "/socket.io/"
            mSocket =
                IO.socket(
                    "http://ec2-3-99-191-110.ca-central-1.compute.amazonaws.com:3000/game",
                    options
                )


        } catch (e: URISyntaxException) {
            Log.e("SocketHandler", "Socket initialization failed: ${e.message}")
        }
    }

    @Synchronized
    fun getSocket(): Socket {
        return mSocket
    }

    @Synchronized
    fun establishConnection() {
        Log.d("TAG", "establishing connection")
        mSocket.connect().on(Socket.EVENT_CONNECT) {
            Log.d("SocketHandler", "✅ Connected to server")
            Log.d("SocketHandler", "Connection status: ${mSocket.connected()}")
            Log.d("Socket", "✅ Connected! ID: ${mSocket.id()}")
        }
            .on(Socket.EVENT_DISCONNECT) {
                Log.d("SocketHandler", "❌ Disconnected from server")
            }
            .on(Socket.EVENT_CONNECT_ERROR) { args ->
                Log.e("SocketHandler", "Connection error: ${args.toList().joinToString()}")
            }
    }

    @Synchronized
    fun closeConnection() {
        mSocket.disconnect()
    }
}