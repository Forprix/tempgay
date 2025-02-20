// @ts-nocheck

import { string, int8, int16, int32, uint8, uint16, uint32, float32, number, boolean, object, any, array, raw } from './serializer.js'



/** @typedef {'string' | 'int8' | 'int16' | 'int32' | 'uint8' | 'uint16' | 'uint32' | 'float32' | 'number' | 'boolean' | 'object' | 'any'} PrimitiveType */
/** @typedef {{ define: (config: { name: string, compress: boolean } | string, ...types: (PrimitiveType | PrimitiveType[] | { [key: string]: PrimitiveType })[]) => void }} MessageDefiner */
/**
 * @param {MessageDefiner} client 
 * @param {MessageDefiner} server 
*/
export default function(client, server) {
    client.define('placedNewBlocks', array([int32, int32, uint8, uint16, any]), string)
    client.define({
        name: 'updateChunk',
        compress: true
    }, int32, int32, { blocks: array(array(uint16, 16 * 16), 2), meta: any })
    client.define('updateAllPlayers', object)
    client.define('playerDisconnect', string)
    client.define('playerUpdate', string, object)
    client.define('requestPlayerUpdate')
    
    server.define('placedNewBlocks', array([int32, int32, uint8, uint16, any]))
    server.define('requestChunk', int32, int32)
    server.define('requestPlayers')
    server.define('playerUpdate', object)

    server.define('socketIoLikeMessage', object)



}