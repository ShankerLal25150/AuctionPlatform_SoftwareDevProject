import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  async create(createItemDto: CreateItemDto, sellerId: number): Promise<Item> {
    const item = this.itemsRepository.create({
      ...createItemDto,
      seller: { id: sellerId },
      currentPrice: createItemDto.startingPrice,
    });
    return this.itemsRepository.save(item);
  }

  async findAll(): Promise<Item[]> {
    return this.itemsRepository.find({
      relations: ['seller', 'bids', 'bids.bidder'],
      order: { endTime: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['seller', 'bids', 'bids.bidder'],
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  async update(
    id: number,
    updateItemDto: Partial<CreateItemDto>,
    sellerId: number,
  ): Promise<Item> {
    const item = await this.findOne(id);
    if (item.seller.id !== sellerId) {
      throw new BadRequestException('Only the seller can update this item');
    }
    Object.assign(item, updateItemDto);
    return this.itemsRepository.save(item);
  }

  async validateBid(itemId: number, amount: number): Promise<boolean> {
    const item = await this.findOne(itemId);
    if (new Date() > item.endTime) {
      throw new BadRequestException('Auction has ended');
    }
    if (amount <= item.currentPrice) {
      console.log(amount, item.currentPrice); 
      throw new BadRequestException('Bid must be higher than current price');
    }
    return true;
  }

  async updateCurrentPrice(itemId: number, newPrice: number): Promise<Item> {
    const item = await this.findOne(itemId);
    item.currentPrice = newPrice;
    return this.itemsRepository.save(item);
  }

  async remove(id: number, sellerId: number): Promise<void> {
    const item = await this.findOne(id);
    if (item.seller.id !== sellerId) {
      throw new BadRequestException('Only the seller can remove this item');
    }
    await this.itemsRepository.remove(item);
  }
}
