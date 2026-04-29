import { SC_Base, SC_Type } from '@/shared/packets/ServerClientPackets';

/**
 * @note Explanation of this Syntax:
 * We are exporting a type of a function.
 * The function has to be called with a data type T that has the fields from SC_Base
 * AND a type parameter with an enum value from the enum SC_Type,
 * or it will throw a compile time error
 * The function takes 2 parameters
 * Parameter 1 is called type, whoose data type is the enum from the type field of the interface given to the template
 * Parameter 2 is and object,
 * that contains the rest of the fields of the given interface, except for type
 * We specify the function returns the specified interface type and return such an object
 *
 * @note You use it like:
 * msgToClient<SC_...>(SC_Type.SC_..., {});
 * where
 * SC_... is the interface type
 * SC_Type.SC_... is the enum entry for the type value
 * {} is an object that can hold the non-base values your object needs set
 */
export type msgToClientType = <T extends SC_Base & { type: SC_Type }>(
  type: T['type'],
  data: Omit<T, keyof SC_Base | 'type'>,
) => void;
