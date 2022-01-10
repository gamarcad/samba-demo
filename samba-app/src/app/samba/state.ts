import {ExecutionHistory} from "./executionHistory";
import {Algorithm} from "./algorithm";
import {SecurityOption} from "../app.component";

export enum SambaState {
  STEP_2,
  STEP_3,
  STEP_4,
  STEP_5,
  STEP_6,
  STEP_7,
}

export enum SambaChapter {
  BEGIN,
  INITIAL_EXPLORATION,
  CORE_OF_PROTO,
  CUMULATIVE_REWARD_COMPUTATION,
}


export class SambaEntity {
  static CONTROLLER = "Controller";
  static COMP = "Comp";
  static NODE = "DO";
  static CUSTOMER = "DC";

  static genNodeName( nodeIndex : any ) : string {
    return this.NODE + nodeIndex
  }

  static known( entity : string, showSecurity : boolean, securityOptions : SecurityOption ) {
    let message = []
    if ( showSecurity ) {
      if ( securityOptions.aes && ( entity == SambaEntity.COMP || SambaEntity.isNode(entity) ) ) {
        message.push( "AESKey" )
      }
      if ( securityOptions.permutation && entity == SambaEntity.CONTROLLER ) {
        message.push( "Perm" )
      }
      if ( securityOptions.mask && SambaEntity.isNode( entity ) ) {
        message.push( "Mask" )
      }
      if ( securityOptions.paillier ) {
        if ( SambaEntity.isNode(entity) ) {
          message.push( "PaillierPK" )
        }
        if ( entity == SambaEntity.CUSTOMER ) {
          message.push( "PaillierPK" )
          message.push( "PaillierSK" )
        }
      }
    }
    if ( message.length == 0 ) return ""
    let res = message[0]
    for ( let index = 1; index < message.length; index++ ) {
      res = res + ', ' + message[index]
    }
    return res
  }

  static isNode( entity :string ) : boolean {
    return entity == SambaEntity.NODE || entity.startsWith(SambaEntity.NODE)
  }
}
