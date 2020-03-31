class UsersService {
    constructor() {
        this.users =[] ;
    }

    getAllUsers() {
        return this.users;
    }

    getUsersById(userID) {
        return this.users.filter( user => user.userID == userID);
    }

    addUser(user) {
        this.users = [user, ...this.users];
    }

    removeUser(socketID) {
        this.users = this.users.filter(user => user.socketID != socketID);
    }
}

module.exports = UsersService;