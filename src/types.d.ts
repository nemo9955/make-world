declare module "worker-loader!*" {
    class WebpackWorker extends Worker {
        name: string;
        constructor();
    }

    export default WebpackWorker;
}