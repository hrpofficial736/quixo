package socket

import (
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

func addToRoom(eventName string, payload map[string]string, conn *websocket.Conn, host bool) {
	log.Println("room addition request received: ", eventName, payload)
	pairingId := payload["pairingId"]
	var success bool
	var msg string
	var data interface{}
	res := SocketResponse{
		EventName: eventName,
		Success:   success,
		Message:   msg,
		Data:      data,
	}
	if (*rooms)[pairingId] == nil {
		if !host {
			res.Success, res.Message = false, "Room not found!"
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
		ID:         uuid.NewString(),
		Conn:       conn,
		PairingID:  pairingId,
		DeviceName: payload["thisDeviceName"],
	}
	(*rooms)[pairingId] = append((*rooms)[pairingId], client)
	if !host {
		res.EventName, res.Success, res.Message = "room_ready", true, "Both clients are added in the room successfully"
		for id, cl := range (*rooms)[pairingId] {
			var otherDeviceName string
			if id == 0 {
				otherDeviceName = client.DeviceName
			} else {
				otherDeviceName = (*rooms)[pairingId][0].DeviceName
			}
			log.Println(host, otherDeviceName)
			res.Data = map[string]string{"id": cl.ID, "pairingId": pairingId, "otherDeviceName": otherDeviceName}
			sendEvent(cl.Conn, res)
		}
		return
	}
	res.EventName, res.Success, res.Message = "ready_to_pair", true, "Device ready to be paired!"
	res.Data = map[string]string{"id": client.ID, "pairingId": pairingId}
	log.Println("sending ready to pair event to host...")
	sendEvent(conn, res)
}

func sendICECandidates(eventName string, payload IceCandidatesPayload, conn *websocket.Conn) {
	log.Println("ice candidates received: ", payload.Candidate)
	pairingId := payload.PairingId
	clientId := payload.ClientId

	res := SocketResponse{
		EventName: eventName,
		Success:   true,
		Message:   "Ice candidates received from other client!",
		Data:      map[string]interface{}{"candidate": payload.Candidate},
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

func sendSessionDescription(eventName string, payload SessionDescriptionPayload, conn *websocket.Conn) {
	log.Println("sd received: ", payload.Sd)
	pairingId := payload.PairingId
	clientId := payload.ClientId

	res := SocketResponse{
		EventName: eventName,
		Success:   true,
		Message:   "Session description received from other client!",
		Data:      map[string]interface{}{"sd": payload.Sd},
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

func deleteRoom(pairingId string) {
	if clients, ok := (*rooms)[pairingId]; ok {
		res := SocketResponse{
			EventName: "room_deleted",
			Success:   true,
			Message:   "Room has been deleted",
		}
		for _, client := range clients {
			sendEvent(client.Conn, res)
		}
	} else {
		log.Println("No clients found for room:", pairingId)
	}
	delete(*rooms, pairingId)
}
