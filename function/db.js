var INT = 0;
var BOOL = 1;
var TEXT = 2;
var TIME = 3;
var DATE = 4;
var DOUBLE = 5;

var dbData = [
        {name: 'Booking', columns: [
            {name: 'resourceId', type: INT, isPrimary: true},
            {name: 'date', type: DATE, isPrimary: true},
            {name: 'slotId', type: INT, isPrimary: true},
            {name: 'userId', type: INT, isPrimary: true},
            {name: 'bookingTime', type: TIME},
            {name: 'reminderMedia', type: INT},
            {name: 'reminderTimes', type: INT}
        ]},
        {name: 'BookingQueue', columns: [
            {name: 'resourceId', type: INT, isPrimary: true},
            {name: 'date', type: DATE, isPrimary: true},
            {name: 'slotId', type: INT, isPrimary: true},
            {name: 'typeId', type: INT, isPrimary: true},
            {name: 'userId', type: INT, isPrimary: true},
            {name: 'count', type: INT, isPrimary: true},
            {name: 'creationTime', type: TIME},
            {name: 'alert', type: INT},
            {name: 'autobook', type: BOOL},
            {name: 'reminderMedia', type: INT},
            {name: 'reminderTimes', type: INT}
        ]},
        {name: 'BookingUnit', columns: [
            {name: 'resourceId', type: INT, isPrimary: true},
            {name: 'date', type: DATE, isPrimary: true},
            {name: 'slotId', type: INT, isPrimary: true},
            {name: 'typeId', type: INT, isPrimary: true},
            {name: 'unitId', type: INT, isPrimary: true},
            {name: 'userId', type: INT, isPrimary: true}
        ]},
        {name: 'Message', columns: [
            {name: 'id', type: INT, isPrimary: true},
            {name: 'fromUserId', type: INT},
            {name: 'subject', type: TEXT},
            {name: 'body', type: TEXT},
            {name: 'creationTime', type: TIME},
            {name: 'replyToMessageId', type: INT}
        ]},
        {name: 'Notification', columns: [
            {name: 'id', type: INT, isPrimary: true},
            {name: 'recipientId', type: INT},
            {name: 'notificationTypeId', type: INT},
            {name: 'referenceId', type: INT},
            {name: 'statusId', type: INT},
            {name: 'statusTime', type: TIME}
        ]},
        {name: 'Resource', columns: [
            {name: 'id', type: INT, isPrimary: true},
            {name: 'name', type: TEXT},
            {name: 'slotSetId', type: INT},
        ]},
        {name: 'ResourceUnit', columns: [
            {name: 'resourceId', type: INT, isPrimary: true},
            {name: 'typeId', type: INT, isPrimary: true},
            {name: 'unitId', type: INT, isPrimary: true},
            {name: 'name', type: TEXT}
        ]},
        {name: 'ResourceUnitType', columns: [
            {name: 'resourceId', type: INT, isPrimary: true},
            {name: 'typeId', type: INT, isPrimary: true},
            {name: 'name', type: TEXT}
        ]},
        {name: 'SystemUser', columns: [
            {name: 'userId', type: INT, isPrimary: true},
            {name: 'permission', type: INT}
        ]},
        {name: 'User', columns: [
            {name: 'id', type: INT, isPrimary: true},
            {name: 'firstName', type: TEXT},
            {name: 'lastName', type: TEXT},
            {name: 'email', type: TEXT},
            {name: 'md5Password', type: TEXT}
        ]},
        {name: 'TimeSlot', columns: [
            {name: 'setId', type: INT, isPrimary: true},
            {name: 'slotId', type: INT, isPrimary: true},
            {name: 'name', type: TEXT},
        ]},
        {name: 'TimeSlotSet', columns: [
            {name: 'id', type: INT, isPrimary: true},
            {name: 'name', type: TEXT},
        ]},
]

function backupTable(fs, contactModule, response, connection, path, reply, tableIndex) {
    if (tableIndex >= dbData.length) {
        var todayStr = new Date().toISOString().slice(0, 10);
        var targetFile = "backup/backup_" + todayStr + ".txt";
        // TODO: Error handling
        fs.writeFileSync(targetFile, fs.readFileSync(path));
        contactModule.handleReply(response, connection, reply);
    } else {
        var tableData = dbData[tableIndex];
        var tableName = tableData.name;
        var columnData = tableData.columns;
        var columns = '';
        var selects = '';
        var count = columnData.length;
        for (var i = 0; i < count; i++) {
            if (i > 0) {
                columns += ',';
                selects += ',';
            }
            var cData = columnData[i];
            columns += cData.name;
            if (cData.type == TIME) {
                selects += "DATE_FORMAT(" + cData.name + ", '%Y-%m-%d %H:%i:%s')";
            } else if (cData.type == DATE) {
                selects += "DATE_FORMAT(" + cData.name + ", '%Y-%m-%d')";
            } else {
                selects += cData.name;
            }
        }
        var insert = 'INSERT INTO ' + tableName + '(' + columns + ') VALUES (';
	
        var sql = 'SELECT ' + columns + ' FROM ' + tableName + ' ORDER BY ' + columns;
        console.log(sql);
        connection.query(sql, function(err, rows, fields) {
            if (!err) {
                var content = 'TRUNCATE ' + tableName + ';\n';
                var isFirst = true;
                var rowCount = rows.length;
                for (var row = 0; row < rowCount; row++) {
                    if (row % 100 == 99) {
                        content += ');\n';
                        isFirst = true;
		            }
                    if (isFirst) {
                        isFirst = false;
                        content += insert;
                    } else {
                        content += '),(';
                    }
                    for (var i = 0; i < count; i++) {
                        if (i > 0) {
                            content += ',';
                        }
                        var column = columnData[i].name;
                        var type = columnData[i].type;
                        var value = rows[row][column];
                        value = connection.escape(value);
/*                        if (value == null) {
                            value = 'NULL';
                        } else if (type == TEXT) {
                            value = "'" + connection.escape(value) + "'";
                        } else if (type == TIME) {
                            value = "'" + value + "'";
                        } else if (type == DATE) {
                            value = "'" + value + "'";
                        }*/
                        content += value;
                    }
                }
                if (!isFirst) {
                    content += ');\n\n';
                }
                fs.appendFile(path, content, function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    sql = 'SELECT COUNT(*) AS count FROM ' + tableName;
                    console.log(sql);
                    connection.query(sql, function(err, rows, fields) {
                        if (!err) {
                            var checkCount = rows[0].count;
                            if (checkCount != rowCount) {
                                reply.push({error: "DB backup diff: " + tableName + " "  + rowCount + " != " + checkCount});
                            }
                            backupTable(fs, contactModule, response, connection, path, reply, tableIndex + 1);
                        } else {
                            contactModule.handleError(response, connection, err);
                        }
                    });
                });
            } else {
                reply.push({error: tableData.name + ": " + err + "\n"});
                backupTable(fs, contactModule, response, connection, path, reply, dbData, tableIndex + 1);
            }
        });
    }
}

function createBackup(fs, contactModule, response, connection) {
    var path = "backup/backup.txt";
    console.log("Saving backup to " + path);
    fs.writeFile(path, '', function(err) { // Clear file
        backupTable(fs, contactModule, response, connection, path, [], 0);
    });
}

module.exports = {
    createBackup: function(fs, contactModule, response, pool, sessionKey) {
        contactModule.initRequest(response, pool, sessionKey, function(response, connection, userId) {
            createBackup(fs, contactModule, response, connection);
        });
    },
}
