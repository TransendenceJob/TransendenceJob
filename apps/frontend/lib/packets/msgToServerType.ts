// @ts-ignore
import { CS_Base, CS_Type } from '../../shared/ClientServerPackets';

/**
 * @note Explanation of this Syntax:
 * We are exporting a type of a function.
 * The function has to be called with a data type T that has the fields from CS_Base
 * AND a type parameter with an enum value from the enum CS_Type,
 * or it will throw a compile time error
 * The function takes 2 parameters
 * Parameter 1 is called type, whoose data type is the enum from the type field of the interface given to the template
 * Parameter 2 is and object,
 * that contains the rest of the fields of the given interface, except for type
 * We specify the function returns the specified interface type and return such an object
 * 
 * @note You use it like:
 * msgToServer<CS_ConnectAttempt>(CS_Type.CS_ConnectAttempt, {});
 * where 
 * CS_ConnectAttempt is the interface type
 * CS_Type.CS_ConnectAttempt is the enum entry for the type value
 * {} is an object that can hold the non-base values your object needs set
 */
export type msgToServerType = <T extends CS_Base & { type: CS_Type }>(
		type: T['type'],
   		data: Omit<T, | 'type' | 'lobbyId'>,
	) => void;