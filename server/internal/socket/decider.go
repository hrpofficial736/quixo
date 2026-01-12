package socket

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

func decider(req SocketRequest, conn *websocket.Conn) {

	switch req.EventName {
	case "ready_to_pair":
		var payload map[string]string
		if err := json.Unmarshal(req.Data, &payload); err != nil {
			log.Println("invalid ready_to_pair payload: ", err)
			return
		}
		addToRoom(req.EventName, payload, conn, true)

	case "request_to_pair":
		var payload map[string]string
		if err := json.Unmarshal(req.Data, &payload); err != nil {
			log.Println("invalid request_to_pair payload: ", err)
			return
		}
		addToRoom(req.EventName, payload, conn, false)

	case "ice-candidates":
		var payload IceCandidatesPayload
		if err := json.Unmarshal(req.Data, &payload); err != nil {
			log.Println("invalid ice-candidates payload: ", err)
			return
		}
		sendICECandidates(req.EventName, payload, conn)

	case "offer":
		var payload SessionDescriptionPayload
		if err := json.Unmarshal(req.Data, &payload); err != nil {
			log.Println("invalid offer payload: ", err)
			return
		}
		sendSessionDescription(req.EventName, payload, conn)

	case "answer":
		var payload SessionDescriptionPayload
		if err := json.Unmarshal(req.Data, &payload); err != nil {
			log.Println("invalid answer payload: ", err)
			return
		}
		sendSessionDescription(req.EventName, payload, conn)

	case "delete_room":
		var data map[string]string
		if err := json.Unmarshal(req.Data, &data); err != nil {
			log.Println("invalid delete_room payload")
			return
		}
		deleteRoom(data["pairingId"])
	}
}
