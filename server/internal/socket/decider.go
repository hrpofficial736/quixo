package socket

import "github.com/gorilla/websocket"

func decider(req SocketRequest, conn *websocket.Conn) (SocketResponse, error) {
	switch req.EventName {
	case "ready_to_pair":
		res := AssignRoom(req.Data, conn)
		if res {
			return SocketResponse{
				EventName: req.EventName,
				Message:   "Device ready to be paired!",
				Success:   true,
			}, nil
		}
		return SocketResponse{
			EventName: req.EventName,
			Message:   "Room is already full please try again later!",
			Success:   false,
		}, nil
	case "request_to_pair":
		res, msg := RequestToPair(req.Data, conn)
		return SocketResponse{
			EventName: req.EventName,
			Message:   msg,
			Data:      req.Data,
			Success:   res,
		}, nil
	default:
		return SocketResponse{}, nil
	}
}
