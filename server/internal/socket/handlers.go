package socket

import (
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

func addToRoom(req SocketRequest, conn *websocket.Conn, host bool) {
	pairingId := req.Data["pairingId"]
	var success bool
	var msg string
	var data interface{}
	res := SocketResponse{
		EventName: req.EventName,
		Success:   success,
		Message:   msg,
		Data:      data,
	}
	if (*rooms)[pairingId] == nil {
		if !host {
			res.Success, res.Message = false, "No room exists for this pairing id!"
			sendEvent(conn, res)
			return
		}
		(*rooms)[pairingId] = []Client{}
	}

	if len((*rooms)[pairingId]) == 2 {
		res.Success, res.Message = false, "Room is full already!"
		sendEvent(conn, res)
		return
	}
	client := Client{
		ID:        uuid.NewString(),
		Conn:      conn,
		PairingID: pairingId,
	}
	(*rooms)[pairingId] = append((*rooms)[pairingId], client)
	if !host {
		res.EventName, res.Success, res.Message = "room_ready", true, "Both clients are added in the room successfully"
		for _, client := range (*rooms)[pairingId] {
			sendEvent(client.Conn, res)
		}
		return
	}
	res.Success, res.Message = true, "Device ready to be paired!"
	sendEvent(conn, res)
}

func sendICECandidates(req SocketRequest, conn *websocket.Conn) {
	pairingId := req.Data["pairingId"]
	clientId := req.Data["clientId"]

	res := SocketResponse{
		EventName: req.EventName,
		Success:   true,
		Message:   "Ice candidates received from other client!",
		Data:      req.Data["candidate"],
	}

	for _, client := range (*rooms)[pairingId] {
		if client.ID != clientId {
			sendEvent(client.Conn, res)
			return
		}
	}
	res.Success, res.Message = false, "No client found to exchange ICE candidates with!"
	sendEvent(conn, res)
}

func sendSessionDescription(req SocketRequest, conn *websocket.Conn) {
	pairingId := req.Data["pairingId"]
	clientId := req.Data["clientId"]

	res := SocketResponse{
		EventName: req.EventName,
		Success:   true,
		Message:   "Session description received from other client!",
		Data:      req.Data["sd"],
	}

	for _, client := range (*rooms)[pairingId] {
		if client.ID != clientId {
			sendEvent(client.Conn, res)
			return
		}
	}
	res.Success, res.Message = false, "No client found to send this session description!"
	sendEvent(conn, res)
}
