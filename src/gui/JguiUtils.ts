import { MessageType, WorkerPacket } from "../modules/Config";
import { JguiMake, JguiManager } from "./JguiMake";


export type jguiData = {
    jgui: JguiMake,
    jguiMng: JguiManager,
}


export function setMainContainer(the_worker: Worker, workerJgui: JguiMake) {
    the_worker.postMessage(<WorkerPacket>{
        message: MessageType.RefreshJGUI,
        jgui: workerJgui,
        metadata: {
            isMainWorkerContainer: true,
        }
    });
}


export function setTempContainer(the_worker: Worker, workerJgui: JguiMake) {
    the_worker.postMessage(<WorkerPacket>{
        message: MessageType.RefreshJGUI,
        jgui: workerJgui,
        metadata: {
            isTempWorkerContainer: true,
        }
    });
}
