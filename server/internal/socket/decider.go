package socket

import "github.com/gorilla/websocket"

func decider(req SocketRequest, conn *websocket.Conn) {

	switch req.EventName {
	case "ready_to_pair":
		addToRoom(req, conn, true)

	case "request_to_pair":
		addToRoom(req, conn, false)

	case "ice-candidates":
		sendICECandidates(req, conn)

	case "offer":
		sendSessionDescription(req, conn)

	case "answer":
		sendSessionDescription(req, conn)
	}
}
