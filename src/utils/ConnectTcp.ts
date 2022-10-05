import TcpSocket from 'react-native-tcp-socket';
import { ConnectionOptions } from 'react-native-tcp-socket/lib/types/Socket';

// Consts
import { RequiredMessages, StartStreamMessage } from '../consts/RequiredMessages';

// Utils
import YPC99ParseLoop from './YPC99ParseLoop';


function ConnectTcp(
    options: ConnectionOptions,
    callback: Function,
    callbackError: Function,
    callbackClose: Function,
) {
    const client = TcpSocket.connect(options, () => {
        client.write(RequiredMessages[1]);
        client.write(RequiredMessages[2]);
        client.write(RequiredMessages[3]);

        client.write(StartStreamMessage);
    });

    client.on('data', function (data) {
        YPC99ParseLoop(data, (frame: string) => callback(frame));
    });

    client.on('error', function (error) {
        callbackError(error);
    });

    client.on('close', function () {
        callbackClose();
    });
}

export default ConnectTcp;
