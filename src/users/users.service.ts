import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/services/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dtos/login-user.dto';
import { LoginResponse, UserPayload } from './interfaces/users-login.interface';
import { UpdateUserDto } from './dtos/update-user.dto';
// import { LoginUserDto } from './dtos/login-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      // create new user using prisma client
      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: await hash(createUserDto.password, 10),
          name: createUserDto.name,
        },
      });

      delete newUser.password;
      return newUser;
    } catch (error) {
      // check if email already registered and throw error
      if (error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }

      // throw error if any other error occurs
      throw new HttpException(error, 500);
    }
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<LoginResponse> {
    try {
      // find user by email
      const user = await this.prisma.user.findUnique({
        where: {
          email: loginUserDto.email,
        },
      });

      // check if user exists
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // check if password is correct by comparing it with the hashed password in the database
      if (!(await compare(loginUserDto.password, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: UserPayload = {
        // create payload for jwt token
        sub: user.id,
        name: user.name,
        email: user.email,
      };

      return {
        // return jwt token
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      // find user by id, if not found throw error
      await this.prisma.user.findFirstOrThrow({
        where: {
          id,
        },
      });

      // update user using prisma client
      const updatedUser = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          ...updateUserDto,
          // if password is provided, hash it before updating
          ...(updateUserDto.password && {
            password: await hash(updateUserDto.password, 10),
          }),
        },
      });

      // remove password from the response
      delete updatedUser.password;

      return updatedUser;
    } catch (error) {
      // check if user not found and throw error
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      // check if email already registered and throw error
      if (error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }

      // throw error if any other error occurs
      throw new HttpException(error, 500);
    }
  }

  async deleteUser(id: number): Promise<string> {
    try {
      // find user by id, if not found throw error
      const user = await this.prisma.user.findFirstOrThrow({
        where: {
          id,
        },
      });

      // delete user using prisma client
      await this.prisma.user.delete({
        where: {
          id,
        },
      });

      return `User with id ${user.id} deleted successfully`;
    } catch (error) {
      // check if user not found and throw error
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      // throw error if any other error occurs
      throw new HttpException(error, 500);
    }
  }
}
