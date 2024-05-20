import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
export class UsersController {
  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDto): string {
    console.log(createUserDto);
    return 'Post user';
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto): string {
    console.log(loginUserDto);
    return 'Post login';
  }

  @Get('me')
  me(): string {
    return 'Get my Profile!';
  }

  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): string {
    console.log(updateUserDto);
    return `Update user with id ${id}`;
  }

  @Delete(':id')
  deleteUserDto(@Param('id', ParseIntPipe) id: number): string {
    return `Delete user with id ${id}`;
  }
}
