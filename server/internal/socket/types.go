package socket

import "github.com/gorilla/websocket"

type SocketRequest struct {
	EventName string            `json:"eventName"`
	Data      map[string]string `json:"data"`
}

type SocketResponse struct {
	EventName string      `json:"eventName"`
	Data      interface{} `json:"data"`
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
}

type Client struct {
	ID        string
	Conn      *websocket.Conn
	PairingID string
}
