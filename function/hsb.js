var notificationTypeMessage = 1;
var statusNew = 1;
var permissionAdmin = 2048;
var crypto = require('crypto');
var uuid = require('uuid');

function handleError(response, connection, message) {
    console.log('Error while performing Query. ' + message);
    if (connection != null) {
        connection.release();
    }
    response.end(JSON.stringify({error:message}));
}

function handleReply(response, connection, reply) {
    if (connection != null) {
        connection.release();
    }
    response.end(JSON.stringify(reply));
}

function loginReply(response, connection, sessionKey, userId, title) {
    var reply = {sessionKey:sessionKey, title: title};
    // Add system permission
    var sql = "SELECT permission FROM SystemUser WHERE userId=" + userId;
    connection.query(sql, function(err, rows, fields) {
        if (!err) {
            if (rows.length > 0) {
                var permission = rows[0].permission;
                reply.systemPermission = permission;
            }
            var sql = "SELECT id, name FROM TimeSlotSet";
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    var slotSet = {};
                    for (var i = 0; i < rows.length; i++) {
                        var id = rows[i].id;
                        var name = rows[i].name;
                        var record = {typeId: id, name: name, slots:[]};
                        slotSet[id] = record;
                    }
                    reply.slotSet = slotSet;
                    var sql = "SELECT setId, slotId, name FROM TimeSlot ORDER BY setId, slotId";
                    connection.query(sql, function(err, rows, fields) {
                        if (!err) {
                            for (var i = 0; i < rows.length; i++) {
                                var setId = rows[i].setId;
                                var slotId = rows[i].slotId;
                                var name = rows[i].name;
                                var record = {slotId: slotId, name: name};
                                slotSet[setId].slots.push(record);
                            }
                            var sql = "SELECT id, name, slotSetId FROM Resource";
                            connection.query(sql, function(err, rows, fields) {
                                if (!err) {
                                    var resourceIds = {}
                                    var resourceNames = {}
                                    for (var i = 0; i < rows.length; i++) {
                                        var id = rows[i].id;
                                        var name = rows[i].name;
                                        var slotSetId = rows[i].slotSetId;
                                        var set = slotSet[slotSetId];
                                        var record = {resourceId: id, name: name, slots: set.slots, unitTypeMap: {}, unitTypes: []};
                                        resourceIds[id] = record;
                                        resourceNames[name] = record;
                                    }
                                    reply.resources = resourceNames;
                                    var sql = "SELECT resourceId, typeId, name FROM ResourceUnitType";
                                    connection.query(sql, function(err, rows, fields) {
                                        if (!err) {
                                            for (var i = 0; i < rows.length; i++) {
                                                var resourceId = rows[i].resourceId;
                                                var typeId = rows[i].typeId;
                                                var name = rows[i].name;
                                                var resource = resourceIds[resourceId];
                                                var record = {typeId: typeId, name: name, units: []}
                                                resource.unitTypeMap[typeId] = record;
                                                resource.unitTypes.push(record);
                                            }
                                            var sql = "SELECT resourceId, typeId, unitId, name FROM ResourceUnit";
                                            connection.query(sql, function(err, rows, fields) {
                                                if (!err) {
                                                    for (var i = 0; i < rows.length; i++) {
                                                        var resourceId = rows[i].resourceId;
                                                        var typeId = rows[i].typeId;
                                                        var unitId = rows[i].unitId;
                                                        var name = rows[i].name;
                                                        var resource = resourceIds[resourceId];
                                                        var type = resource.unitTypeMap[typeId];
                                                        var record = {unitId: unitId, name: name}
                                                        type.units.push(record);
                                                    }
                                                    // Cleanup
                                                    for (var id in resourceIds) {
                                                        var r = resourceIds[id];
                                                        r.unitTypeMap = null;
                                                    }
                                                    handleReply(response, connection, reply);
                                                } else {
                                                    handleError(response, connection, err);
                                                }
                                            });                                
                                        } else {
                                            handleError(response, connection, err);
                                        }
                                    });                                
                                } else {
                                    handleError(response, connection, err);
                                }
                            });
                        } else {
                            handleError(response, connection, err);
                        }
                    });
                } else {
                    handleError(response, connection, err);
                }
            });
        } else {
            handleError(response, connection, err);
        }
    });
}

function loadUser(response, connection, userId) {
    var sql = "SELECT firstName, lastName FROM User WHERE id = " + userId;
    console.log(sql);
    connection.query(sql, function(err, rows, fields) {
        if (!err) {
            if (rows.length > 0) {
                var firstName = rows[0].firstName;
                var lastName = rows[0].lastName;
                var user = {userId: userId, firstName: firstName, lastName: lastName};
                var sql = "SELECT DATE_FORMAT(b.date, '%Y-%m-%d') AS date, ts.name AS slot, ts.slotId, " + 
                    "rut.name AS type, rut.typeId, ru.unitId, COUNT(ru.name) AS count " + 
                    "FROM Booking b, BookingUnit bu, Resource r, ResourceUnit ru, ResourceUnitType rut, TimeSlot ts " + 
                    "WHERE b.userId = " + userId + " AND b.date >= NOW() AND bu.resourceId = b.resourceId AND bu.date = b.date " + 
                    "AND bu.slotId = b.slotId AND r.id = b.resourceId AND ru.resourceId = r.id AND ru.unitId = bu.unitId " + 
                    "AND rut.resourceId = r.id AND rut.typeId = bu.typeId AND ts.setId = r.slotSetId AND ts.slotId = bu.slotId " + 
                    "GROUP BY b.date, rut.resourceId, rut.typeId " + 
                    "ORDER BY b.date, ts.slotId, type";
                console.log(sql);
                connection.query(sql, function(err, rows, fields) {
                    if (!err) {
                        var bookings = [];
                        for (var i = 0; i < rows.length; i++) {
                            var date = rows[i].date;
                            var slot = rows[i].slot;
                            var slotId = rows[i].slotId;
                            var type = rows[i].type;
                            var typeId = rows[i].typeId;
                            var unitId = rows[i].unitId;
                            var count = rows[i].count;
                            var booking = {date: date, slot: slot, slotId: slotId, type: type, typeId: typeId, unitId: unitId, count: count};
                            bookings.push(booking);
                        }
                        user.bookings = bookings
                        handleReply(response, connection, user);
                    } else {
                        handleError(response, connection, err);
                    }
                });
            } else {
                handleReply(response, connection, {noSuchContact:true});
            }
        } else {
            handleError(response, connection, err);
        }
    });
};
        
function initRequest(response, pool, sessionKey, continueRequest) {
    response.setHeader('Content-Type', 'application/json');
    pool.getConnection(function(err,connection){
        if (err) {
            if (connection != null) {
                connection.release();
            }
            handleError(response, connection, err);
            return;
        }
        var sql = "SELECT userId, (DATE_ADD(validUntil, INTERVAL 1 HOUR) < NOW()) AS needsRefresh FROM Session WHERE sessionKey=" + 
            sessionKey + " AND validUntil > NOW()";
        console.log(sql);
        connection.query(sql, function(err, rows, fields) {
            if (!err) {
                if (rows.length > 0) {
                    var userId = rows[0].userId;
                    var needsRefresh = rows[0].needsRefresh;
                    if (needsRefresh) {
                        // Update session to be valid for another two hours
                        var sql = "UPDATE Session SET validUntil=DATE_ADD(NOW(), INTERVAL 2 HOUR) WHERE sessionKey=" + sessionKey + "";
                        console.log(sql);
                        connection.query(sql, function(err, rows, fields) {
                            if (!err) {
                                continueRequest(response, connection, userId);
                            } else {
                                handleError(response, connection, err);
                            }
                        });
                    } else {
                        continueRequest(response, connection, userId);
                    }
                } else {
                    handleReply(response, connection, {loginRequired:true});
                }
            } else {
                handleError(response, connection, err);
            }
        });
    });
}
        
module.exports = {
    login: function(response, pool, email, password, title) {
        // Convert to md5
        var md5Password = crypto.createHash('md5').update(password).digest('hex');
        response.setHeader('Content-Type', 'application/json');
        pool.getConnection(function(err,connection){
            if (err) {
                handleError(response, connection, err);
                return;
            }
            var sql = "SELECT id FROM User WHERE email=" + email + 
                " AND md5Password='" + md5Password + "'";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    if (rows.length > 0) {
                        var userId = rows[0].id;
                        var sql = "SELECT sessionKey, validUntil FROM Session WHERE userId=" + userId + " AND validUntil > NOW()";
                        console.log(sql);
                        connection.query(sql, function(err, rows, fields) {
                            if (!err) {
                                if (rows.length > 0) {
                                    var sessionKey = rows[0].sessionKey;
                                    var validUntil = rows[0].validUntil;
                                    console.log(sessionKey)
                                    loginReply(response, connection, sessionKey, userId, title);
                                } else {
                                    var sessionKey = uuid.v4();
                                    var sql = "INSERT INTO Session(userId, sessionKey, validFrom, validUntil) VALUES(" + 
                                        userId + ", '" + sessionKey + "', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR))";
                                    console.log(sql);
                                    connection.query(sql, function(err, rows, fields) {
                                        if (!err) {
                                            loginReply(response, connection, sessionKey, userId, title);
                                        }
                                    });
                                }
                            } else {
                                handleError(response, connection, err);
                            }
                        });
                    } else {
                        handleError(response, connection, err);
                    }
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    initRequest: function(response, pool, sessionKey, continueRequest) {
        initRequest(response, pool, sessionKey, continueRequest);
    },
    handleError: function(response, connection, message) {
        handleError(response, connection, message);
    },
    handleReply: function(response, connection, reply) {
        handleReply(response, connection, reply);
    },
    currentUser: function(response, pool, sessionKey) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            loadUser(response, connection, userId);
        });
    },
    notifications: function(response, pool, sessionKey, typeMask, statusMask) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "SELECT n.id, n.notificationTypeId, n.referenceId, n.statusId, " + 
                "DATE_FORMAT(n.statusTime, '%Y-%m-%d') AS statusTime, m.fromUserId, m.subject, m.body, " + 
                "DATE_FORMAT(m.creationTime, '%Y-%m-%d') AS creationTime, u.firstName, u.lastName " +
                "FROM Notification n LEFT JOIN Message m ON n.notificationTypeId = " + notificationTypeMessage + " AND n.referenceId = m.id " + 
                "LEFT JOIN User u ON u.id = m.fromUserId " +
                "WHERE recipientId = " + userId + " AND (notificationTypeId & " + typeMask + 
                ") > 0 AND (statusId & " + statusMask + ") > 0";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    notifications = [];
                    for (var i in rows) {
                        var id = rows[i].id;
                        var notificationTypeId = rows[i].notificationTypeId;
                        var referenceId = rows[i].referenceId;
                        var statusId = rows[i].statusId;
                        var statusTime = rows[i].statusTime;
                        var fromUserId = rows[i].fromUserId;
                        var firstName = rows[i].firstName;
                        var lastName = rows[i].lastName;
                        var subject = rows[i].subject;
                        var body = rows[i].body;
                        var creationTime = rows[i].creationTime;
                        var record = {id: id, typeId: notificationTypeId, referenceId: referenceId,
                                      statusId: statusId, statusTime: statusTime,
                                      fromUser: {userId: fromUserId, firstName: firstName, lastName: lastName},
                                      subject: subject, body: body, creationTime: creationTime};
                        notifications.push(record);
                    }
                    handleReply(response, connection, notifications);
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    sendMessage: function(response, pool, sessionKey, subject, body, recipients, replyTo) {
        // Recipients are not escaped yet
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "INSERT INTO Message(fromUserId, subject, body, creationTime, replyToMessageId) VALUES(" + 
                userId + ", " + subject + ", " + body + ", NOW(), " + replyTo + ")";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    var messageId = rows.insertId;
                    var sql = "INSERT INTO Notification(recipientId, notificationTypeId, referenceId, statusId, statusTime) VALUES";
                    for (var i = 0; i < recipients.length; i++) {
                        var recipient = recipients[i];
                        if (i > 0) {
                            sql += ",";
                        }
                        sql += "(" + connection.escape(recipient) + "," + notificationTypeMessage + "," + messageId + "," + statusNew + ",NOW())";
                    }
                    console.log(sql);
                    connection.query(sql, function(err, rows, fields) {
                        if (!err) {
                            handleReply(response, connection, {messageId:messageId});
                        } else {
                            handleError(response, connection, err);
                        }
                    });
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    bookings: function(response, pool, sessionKey, resourceName, calendarStart, dayCount) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "SELECT id FROM Resource WHERE name = " + resourceName;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    if (rows.length > 0) {
                        var resourceId = rows[0].id;
                        var sql = 
                            "SELECT datediff(b.date, " + calendarStart + 
                            ") AS dateDiff, b.slotId, b.userId, b.reminderMedia, b.reminderTimes, u.typeId, u.unitId " + 
                            "FROM Booking b, BookingUnit u " + 
                            "WHERE b.resourceId = " + resourceId + " AND b.date >= " + calendarStart + 
                            " AND b.date < DATE_ADD(" + calendarStart + ", INTERVAL " + dayCount + 
                            " DAY) AND u.resourceId = b.resourceId AND u.date = b.date AND u.slotId = b.slotId AND u.userId = b.userId";
                        console.log(sql);
                        connection.query(sql, function(err, rows, fields) {
                            if (!err) {
                                var bookings = {};
                                for (var i = 0; i < rows.length; i++) {
                                    var row = rows[i];
                                    var dayId = row.dateDiff;
                                    var slotId = row.slotId;
                                    var uId = row.userId;
                                    var media = row.reminderMedia;
                                    var times = row.reminderTimes;
                                    var typeId = row.typeId;
                                    var unitId = row.unitId;

                                    var day = bookings[dayId];
                                    if (day == null) {
                                        day = {};
                                        bookings[dayId] = day;
                                    }
                                    var slot = day[slotId];
                                    if (slot == null) {
                                        slot = {};
                                        day[slotId] = slot;
                                    }
                                    if (uId == userId) {
                                        slot.media = media;
                                        slot.times = times;
                                    }
                                    var type = slot[typeId];
                                    if (type == null) {
                                        type = {units: {}};
                                        slot[typeId] = type;
                                    }
                                    type.units[unitId] = (uId == userId?1:0)
                                }
                                var sql = 
                                    "SELECT datediff(date, " + calendarStart + 
                                    ") AS dateDiff, slotId, typeId, userId, count, alert, autobook, reminderMedia, reminderTimes " + 
                                    "FROM BookingQueue " + 
                                    "WHERE resourceId = " + resourceId + " AND date >= " + calendarStart + 
                                    " AND date < DATE_ADD(" + calendarStart + ", INTERVAL " + dayCount + 
                                    " DAY) ORDER BY creationTime";
                                console.log(sql);
                                connection.query(sql, function(err, rows, fields) {
                                    if (!err) {
                                        for (var i = 0; i < rows.length; i++) {
                                            var row = rows[i];
                                            var dayId = row.dateDiff;
                                            var slotId = row.slotId;
                                            var typeId = row.typeId;
                                            var uId = row.userId;
                                            var count = row.count;
                                            var alert = row.alert;
                                            var autobook = row.autobook;
                                            var media = row.reminderMedia;
                                            var times = row.reminderTimes;

                                            var day = bookings[dayId];
                                            if (day == null) {
                                                day = {};
                                                bookings[dayId] = day;
                                            }
                                            var slot = day[slotId];
                                            if (slot == null) {
                                                slot = {};
                                                day[slotId] = slot;
                                            }
                                            if (uId == userId) {
                                                slot.media = media;
                                                slot.times = times;
                                            }
                                            var type = slot[typeId];
                                            if (type == null) {
                                                type = {units: {}};
                                                slot[typeId] = type;
                                            }
                                            if (type.queue == null) {
                                                type.queue = [];
                                            }
                                            type.queue.push([(uId == userId?1:0), count]);
                                        }
                                        handleReply(response, connection, bookings);
                                    } else {
                                        handleError(response, connection, err);
                                    }
                                });
                            } else {
                                handleError(response, connection, err);
                            }
                        });
                    } else {
                        handleError(response, connection, {noSuchResource: true});
                    }
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },    
    setBooking: function(response, pool, sessionKey, resourceName, date, slotId, type, media, times) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "SELECT id FROM Resource WHERE name = " + resourceName;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    if (rows.length > 0) {
                        var resourceId = rows[0].id;
                        var sql = "REPLACE INTO Booking(resourceId, date, slotId, userId, bookingTime, reminderMedia, reminderTimes) VALUES (" + 
                            resourceId + ", " + date + ", " + slotId + ", " + userId + ", NOW(), " + media + ", " + times + ")";
                        console.log(sql);
                        connection.query(sql, function(err, rows, fields) {
                            if (!err) {
                                var sql = "DELETE FROM BookingUnit WHERE resourceId = " + resourceId + " AND date = " + date + 
                                    " AND slotId = " + slotId + " AND userId = " + userId;
                                console.log(sql);
                                connection.query(sql, function(err, rows, fields) {
                                    if (!err) {
                                        if (type.length == 0) {
                                            handleReply(response, connection, {});
                                        } else {
                                            var sql = "";
                                            for (typeId in type) {
                                                var units = type[typeId];
                                                for (var i = 0; i < units.length; i++) {
                                                    var unitId = units[i];
                                                    if (sql.length > 0) {
                                                        sql += ",";
                                                    }
                                                    sql += "(" + resourceId + "," + date + "," + slotId + "," + typeId + "," + unitId + "," + userId + ")";
                                                }
                                            }
                                            sql = "INSERT IGNORE INTO BookingUnit(resourceId, date, slotId, typeId, unitId, userId) VALUES" + sql;
                                            // Note that this will not replace unit bookings of other users
                                            console.log(sql);
                                            connection.query(sql, function(err, rows, fields) {
                                                if (!err) {
                                                    handleReply(response, connection, {});
                                                } else {
                                                    handleError(response, connection, err);
                                                }
                                            });
                                        }
                                    } else {
                                        handleError(response, connection, err);
                                    }
                                });
                            } else {
                                handleError(response, connection, err);
                            }
                        });
                    } else {
                        handleError(response, connection, {noSuchResource: true});
                    }
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    setQueue: function(response, pool, sessionKey, resourceName, date, slotId, type, alert, autobook, media, times) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "SELECT id FROM Resource WHERE name = " + resourceName;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    if (rows.length > 0) {
                        var resourceId = rows[0].id;
                        var sql = "DELETE FROM BookingQueue WHERE resourceId = " + resourceId + " AND date = " + date + 
                            " AND slotId = " + slotId + " AND userId = " + userId;
                        console.log(sql);
                        connection.query(sql, function(err, rows, fields) {
                            if (!err) {
                                if (type.length == 0) {
                                    handleReply(response, connection, {});
                                } else {
                                    var sql = "";
                                    for (typeId in type) {
                                        var count = type[typeId];
                                        if (sql.length > 0) {
                                            sql += ",";
                                        }
                                        sql += "(" + resourceId + "," + date + "," + slotId + "," + typeId + "," + userId + "," + count + 
                                            ",NOW()," + alert + "," + autobook + "," + media + "," + times + ")";
                                    }
                                    sql = "INSERT IGNORE INTO BookingQueue(resourceId, date, slotId, typeId, userId, count, creationTime, " + 
                                        "alert, autobook, reminderMedia, reminderTimes) VALUES" + sql;
                                    // Note that this will not replace unit bookings of other users
                                    console.log(sql);
                                    connection.query(sql, function(err, rows, fields) {
                                        if (!err) {
                                            handleReply(response, connection, {});
                                        } else {
                                            handleError(response, connection, err);
                                        }
                                    });
                                }
                            } else {
                                handleError(response, connection, err);
                            }
                        });
                    } else {
                        handleError(response, connection, {noSuchResource: true});
                    }
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    
    
    
    
    newContact: function(response, pool, sessionKey, unitId, firstName, lastName) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "INSERT INTO Contact(firstName, lastName, addedBy, addedTime) VALUES(" + 
                firstName + ", " + lastName + ", " + userId + ", NOW())";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    var contactId = rows.insertId;
                    var sql = "INSERT INTO OrganizationContact(unitId, contactId, addedBy, addedTime) VALUES(" + 
                        unitId + ", " + contactId + ", " + userId + ", NOW())";
                    console.log(sql);
                    connection.query(sql, function(err, rows, fields) {
                        if (!err) {
                            handleReply(response, connection, {contactId:contactId});
                        } else {
                            handleError(response, connection, err);
                        }
                    });
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    contact: function(response, pool, sessionKey, contactId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            loadContact(response, connection, contactId);
        });
    },
    updateContact: function(response, pool, sessionKey, contactId, firstName, lastName) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE Contact SET firstName = " + firstName + ", lastName = " + lastName + " WHERE id = " + contactId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {contactId: contactId, firstName: firstName, lastName: lastName});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    deleteContact: function(response, pool, sessionKey, contactId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE Contact SET removedBy = " + userId + ", removedTime = NOW() WHERE id = " + contactId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {contactId: contactId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    newContactInfo: function(response, pool, sessionKey, contactId, typeId, value, notes) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "INSERT INTO ContactInfo(contactId, typeId, value, notes, addedBy, addedTime) VALUES(" + 
                contactId + ", " + typeId + ", " + value + ", " + notes + ", " + userId + ", NOW())";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    var infoId = rows.insertId;
                    handleReply(response, connection, {infoId:infoId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    updateContactInfo: function(response, pool, sessionKey, infoId, value, notes) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE ContactInfo SET value = " + value + ", notes = " + notes + " WHERE id = " + infoId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {infoId: infoId, value: value, notes: notes});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    deleteContactInfo: function(response, pool, sessionKey, infoId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE ContactInfo SET removedBy = " + userId + ", removedTime = NOW() WHERE id = " + infoId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {infoId: infoId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    searchContacts: function(response, pool, sessionKey, search, count) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "SELECT id, firstName, lastName FROM Contact WHERE removedBy IS NULL AND (firstName LIKE " + 
                search + " OR lastName LIKE " + search + ") ORDER BY firstName, lastName LIMIT " + count;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    contacts = [];
                    for (var i in rows) {
                        var id = rows[i].id;
                        var firstName = rows[i].firstName;
                        var lastName = rows[i].lastName;
                        var record = {contactId: id, firstName: firstName, lastName: lastName};
                        contacts.push(record);
                    }
                    loadContactOrganizations(response, connection, contacts, 0);
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    newSkill: function(response, pool, sessionKey, skillCategoryId, name) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "INSERT INTO Skill(name, addedBy, addedTime) VALUES(" + 
                name + ", " + userId + ", NOW())";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    var skillId = rows.insertId;
                    var sql = "INSERT INTO CategorySkill(skillId, categoryId, addedBy, addedTime) VALUES(" + 
                        skillId + ", " + skillCategoryId + ", " + userId + ", NOW())";
                    console.log(sql);
                    connection.query(sql, function(err, rows, fields) {
                        if (!err) {
                            handleReply(response, connection, {skillId:skillId, name: name});
                        } else {
                            handleError(response, connection, err);
                        }
                    });
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    updateSkill: function(response, pool, sessionKey, skillId, name) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE Skill SET name = " + firstName + " WHERE id = " + skillId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {skillId: skillId, name: name});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    deleteSkill: function(response, pool, sessionKey, skillId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE Skill SET removedBy = " + userId + ", removedTime = NOW() WHERE id = " + skillId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {skillId: skillId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },    
    newUser: function(response, pool, sessionKey, contactId, email, password) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "SELECT userId FROM SystemUser u WHERE userId=" + userId + " AND permission & " + permissionAdmin + " > 0"; 
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    if (rows.length > 0) {
                        var adminId = rows[0].userId;
                        // Convert to md5
                        var md5Password = crypto.createHash('md5').update(password).digest('hex');
                        var sql = "INSERT INTO User(contactId, email, md5Password, addedBy, addedTime) VALUES(" + 
                            contactId + ", " + email + ", " + md5Password + ", " + adminId + ", NOW())";
                        console.log(sql);
                        connection.query(sql, function(err, rows, fields) {
                            if (!err) {
                                handleReply(response, connection, {contactId:contactId});
                            } else {
                                handleError(response, connection, err);
                            }
                        });
                    } else {
                        console.log('No admin rights.' + err);
                        handleError(response, connection, err);
                    }
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    skillCategories: function(response, pool, sessionKey) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "SELECT id, name FROM SkillCategory ORDER BY name";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    skillCategories = [];
                    for (var i in rows) {
                        var id = rows[i].id;
                        var name = rows[i].name;
                        var record = {categoryId: id, name: name};
                        skillCategories.push(record);
                    }
                    loadSkillCategory(response, connection, {skillCategories: skillCategories}, 0);
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    
    newCV: function(response, pool, sessionKey, contactId, name, url, categoryId, languageId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "INSERT INTO CV(contactId, name, url, categoryId, languageId, addedBy, addedTime) VALUES(" + contactId + ", " + 
                name + ", " + url + ", " + categoryId + ", " + languageId + ", " + userId + ", NOW())";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    var cvId = rows.insertId;
                    handleReply(response, connection, {cvId:cvId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    updateCV: function(response, pool, sessionKey, cvId, name, url, categoryId, languageId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE CV SET name = " + name + ", url = " + url + ", categoryId = " + categoryId + 
                ", languageId = " + languageId + " WHERE id = " + cvId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {cvId: cvId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    deleteCV: function(response, pool, sessionKey, cvId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE CV SET removedBy = " + userId + ", removedTime = NOW() WHERE id = " + cvId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {cvId: cvId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    updateCVSkill: function(response, pool, sessionKey, contactId, skillId, notes) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "REPLACE INTO CVSkill(contactId, skillId, notes, addedBy, addedTime) VALUES(" + 
                contactId + ", " + skillId + ", " + notes + ", " + userId + ", NOW())";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {contactId: contactId, skillId: skillId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    deleteCVSkill: function(response, pool, sessionKey, contactId, skillId) {
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE CVSkill SET removedBy = " + userId + ", removedTime = NOW() " + 
                "WHERE contactId = " + contactId + " AND skillId = " + skillId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {skillId: skillId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },
    addRelationship: function(response, pool, sessionKey, lowContactId, highContactId, typeId) {
        if (lowContactId > highContactId) {
            var id = lowContactId;
            lowContactId = highContactId;
            highContactId = id;
        }
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "REPLACE INTO Relationship(lowContactId, highContactId, typeId, isReversed, notes, addedBy, addedTime) VALUES(" + 
                lowContactId + ", " + highContactId + ", " + typeId + ", 0, '', " + userId + ", NOW())";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {fromContactId: lowContactId, toContactId: highContactId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },    
    updateRelationship: function(response, pool, sessionKey, lowContactId, highContactId, isReversed, typeId, notes) {
        if (lowContactId > highContactId) {
            var id = lowContactId;
            lowContactId = highContactId;
            highContactId = id;
            isReversed = 1 - isReversed;
        }
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "REPLACE INTO Relationship(lowContactId, highContactId, typeId, isReversed, notes, addedBy, addedTime) VALUES(" + 
                lowContactId + ", " + highContactId + ", " + typeId + ", " + isReversed + ", " + notes + ", " + userId + ", NOW())";
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {fromContactId: lowContactId, toContactId: highContactId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },    
    removeRelationship: function(response, pool, sessionKey, lowContactId, highContactId) {
        if (lowContactId > highContactId) {
            var id = lowContactId;
            lowContactId = highContactId;
            highContactId = id;
        }
        initRequest(response, pool, sessionKey, function(response, connection, userId) {
            var sql = "UPDATE Relationship SET removedBy = " + userId + ", removedTime = NOW() WHERE lowContactId = " + 
                lowContactId + " AND highContactId = " + highContactId;
            console.log(sql);
            connection.query(sql, function(err, rows, fields) {
                if (!err) {
                    handleReply(response, connection, {fromContactId: lowContactId, toContactId: highContactId});
                } else {
                    handleError(response, connection, err);
                }
            });
        });
    },    
}