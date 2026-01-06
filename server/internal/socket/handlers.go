package socket

import (
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

func AssignRoom(data map[string]string, conn *websocket.Conn) bool {
	pairingId := data["pairingId"]
	if (*rooms)[pairingId] == nil {
		(*rooms)[pairingId] = []Client{}
	}
	if len((*rooms)[pairingId]) == 2 {
		return false
	}
	client := Client{
		ID:        uuid.NewString(),
		Conn:      conn,
		PairingID: pairingId,
	}
	(*rooms)[pairingId] = append((*rooms)[pairingId], client)
	return true
}

func RequestToPair(data map[string]string, conn *websocket.Conn) (bool, string) {
	pairingId := data["pairingId"]
	if (*rooms)[pairingId] == nil {
		return false, "No room exists for this pairing id!"
	}
	if len((*rooms)[pairingId]) == 2 {
		return false, "Room is full already!"
	}
	client := Client{
		ID:        uuid.NewString(),
		Conn:      conn,
		PairingID: pairingId,
	}
	(*rooms)[pairingId] = append((*rooms)[pairingId], client)
	return true, "Both clients are ready to be paired!"
}
