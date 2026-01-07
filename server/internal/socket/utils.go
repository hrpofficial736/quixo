package socket

import (
	"log"

	"github.com/gorilla/websocket"
)

func sendEvent(conn *websocket.Conn, data SocketResponse) {
	err := conn.WriteJSON(data)
	if err != nil {
		log.Println("Error writing the message...")
	}

}
