import { Room } from '../core/types';
import roomRepo from '../database/repositories/room';

export class RoomService {
  async getRoom(roomId: number): Promise<Room> {
    const room = await roomRepo.findById(roomId);
    if (!room) throw new Error('Room not found');
    return room;
  }

  async listRooms(): Promise<Room[]> {
    return roomRepo.findAll();
  }

  async getAvailableRooms(): Promise<Room[]> {
    return roomRepo.findAvailable();
  }
}

export default new RoomService();
