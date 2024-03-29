import { types } from 'src/actions/socket';

const {
  SOCKET_OPEN_REQUEST,
  SOCKET_OPEN_SUCCESS,
  SOCKET_CLOSE_REQUEST,
  SOCKET_CLOSE_SUCCESS,
  SOCKET_CONN_ERROR,
  FSA,
  RSSA,
} = types;

const createSocketMiddleware = socket => ({ dispatch }) => {
  socket.on(FSA, dispatch);

  socket.on('connect', () =>
    dispatch({
      type: SOCKET_OPEN_SUCCESS,
      payload: { sid: socket.id },
    })
  );
  socket.on('disconnect', () => dispatch({ type: SOCKET_CLOSE_SUCCESS }));
  socket.on('error', error =>
    dispatch({ type: SOCKET_CONN_ERROR, payload: { error } })
  );

  return next => action => {
    const socketAction = action[RSSA];

    if (socketAction) {
      const { ack, event, message, optimistic } = socketAction;
      message.meta = {
        ...message.meta,
        sid: socket.id,
      };
      socket.emit(event || FSA, message, ack);
      if (optimistic) {
        dispatch(message);
      }
      return;
    }

    switch (action.type) {
      case SOCKET_OPEN_REQUEST:
        socket.connect();
        break;
      case SOCKET_CLOSE_REQUEST:
        socket.disconnect();
        break;
      case SOCKET_CONN_ERROR:
        socket.connect();
        break;
      default:
        break;
    }

    next(action);
  };
};

export default createSocketMiddleware;
