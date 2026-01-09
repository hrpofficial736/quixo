package socket

import (
	"encoding/json"

	"github.com/gorilla/websocket"
)

type SocketRequest struct {
	EventName string          `json:"eventName"`
	Data      json.RawMessage `json:"data"`
}

type SocketResponse struct {
	EventName string      `json:"eventName"`
	Data      interface{} `json:"data"`
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
}

type Client struct {
	ID         string
	DeviceName string
	Conn       *websocket.Conn
	PairingID  string
}

type IceCandidatesPayload struct {
	ClientId  string      `json:"clientId"`
	PairingId string      `json:"pairingId"`
	Candidate interface{} `json:"candidate"`
}

type SessionDescriptionPayload struct {
	ClientId  string      `json:"clientId"`
	PairingId string      `json:"pairingId"`
	Sd        interface{} `json:"sd"`
}
