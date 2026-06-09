import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid } from './entities/bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { ItemsService } from '../items/items.service';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    private itemsService: ItemsService,
  ) {}

  async create(createBidDto: CreateBidDto, bidderId: number): Promise<Bid> {
    await this.itemsService.validateBid(createBidDto.itemId, createBidDto.amount);

    const bid = this.bidsRepository.create({
      amount: createBidDto.amount,
      bidder: { id: bidderId },
      item: { id: createBidDto.itemId }
    });

    await this.itemsService.updateCurrentPrice(createBidDto.itemId, createBidDto.amount);
    return this.bidsRepository.save(bid);
  }

  async findAll(): Promise<Bid[]> {
    return this.bidsRepository.find({
      relations: ['bidder', 'item'],
      order: { bidTime: 'DESC' },
    });
  }

  async findByItemId(itemId: number): Promise<Bid[]> {
    return this.bidsRepository.find({
      where: { item: { id: itemId } },
      relations: ['bidder', 'item'],
      order: { bidTime: 'DESC' },
    });
  }

  async getHighestBid(itemId: number): Promise<Bid | null> {
    return this.bidsRepository.findOne({
      where: { item: { id: itemId } },
      order: { amount: 'DESC' },
      relations: ['bidder', 'item'],
    });
  }
}
