import * as THREE from 'https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js';

class GLTFLoader {
  constructor( manager ) {
    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
  }
  load( url, onLoad, onProgress, onError ) {
    const scope = this;
    const resourcePath = THREE.LoaderUtils.extractUrlBase( url );
    const loader = new THREE.FileLoader( this.manager );
    loader.setResponseType( 'arraybuffer' );
    loader.load( url, function( data ) {
      try {
        scope.parse( data, resourcePath, onLoad, onError );
      } catch ( e ) {
        if ( onError ) {
          onError( e );
        } else {
          throw e;
        }
      }
    }, onProgress, onError );
  }
  parse( data, path, onLoad, onError ) {
    let json;
    const view = new DataView( data );
    const magic = THREE.LoaderUtils.decodeText( new Uint8Array( data, 0, 4 ) );
    if ( magic === 'glTF' ) {
      json = this.parseGLB( data );
    } else {
      json = JSON.parse( THREE.LoaderUtils.decodeText( new Uint8Array( data ) ) );
    }
    const scene = new THREE.Group();
    const result = {
      scene: scene,
      scenes: [ scene ],
      cameras: [],
      animations: [],
      asset: json.asset || {}
    };
    onLoad( result );
  }
  parseGLB( data ) {
    const view = new DataView( data );
    const magic = THREE.LoaderUtils.decodeText( new Uint8Array( data, 0, 4 ) );
    if ( magic !== 'glTF' ) {
      throw new Error( 'THREE.GLTFLoader: magic property must be glTF.' );
    }
    const version = view.getUint32( 4, true );
    const length = view.getUint32( 8, true );
    const headerLength = 12;
    const chunkLength = view.getUint32( headerLength + 4, true );
    const chunkType = view.getUint32( headerLength + 8, true );
    const textDecoder = new TextDecoder();
    const jsonText = textDecoder.decode( new Uint8Array( data, headerLength + 12, chunkLength ) );
    const json = JSON.parse( jsonText );
    return json;
  }
}
export { GLTFLoader };