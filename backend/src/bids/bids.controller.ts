import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Controller('bids')
export class BidsController {
  @WebSocketServer()
  server: Server;

  constructor(private readonly bidsService: BidsService) {}

  // @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createBidDto: CreateBidDto, @Request() req: any) {
    // const bid = await this.bidsService.create(createBidDto, req.user.userId);
    const bid = await this.bidsService.create(createBidDto, 10);
    // this.server.emit(`item-${createBidDto.itemId}`, {
    //   type: 'new_bid',
    //   bid,
    // });
    return bid;
  }

  @Get()
  async findAll() {
    console.log('Attempting to fetch all bids...');
    try {
      const bids = await this.bidsService.findAll();
      return bids;
    } catch (error) {
      console.error('Error fetching bids:', error);
      throw error;
    }
  }

  @Get(':itemId')
  async findByItemId(@Param('itemId') itemId: string) {
    return this.bidsService.findByItemId(+itemId);
  }
}
