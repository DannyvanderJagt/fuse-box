import { Context } from '../../core/context';
import { IModule } from '../../moduleResolver/module';
import { IPluginCommon } from '../interfaces';
export declare function pluginStylusCapture(props: {
    ctx: Context;
    module: IModule;
    opts: IPluginCommon;
}): void;
export declare function pluginStylus(a?: IPluginCommon | RegExp | string, b?: IPluginCommon): (ctx: Context) => void;