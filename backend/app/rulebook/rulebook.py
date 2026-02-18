from flask import Blueprint, jsonify, current_app
from datetime import datetime
from app.db_schema_utils import get_bot_schema
from app.Database.connection_pool import connect_to_database
from app.databaseconnection import db_connect
from app.utils.email_service import notify_automation_engineers_on_rule_change
from app.utils.db_schema import get_db_schema

def get_rulebook_data(bot_id, page_number=1, page_size=50):
    DBSCHEMA = get_bot_schema()
    use_db_connect = DBSCHEMA != "santova"

    conn = db_connect() if use_db_connect else connect_to_database()
    if not conn:
        raise Exception("Database connection failed")

    cursor = conn.cursor()

    current_app.logger.info(
        f"GetRuleBook | schema={DBSCHEMA}, bot_id={bot_id}"
    )

    cursor.execute(
        f"EXEC {DBSCHEMA}.GetRuleBook @BotId=%s, @PageNumber=%s, @PageSize=%s",
        (bot_id, page_number, page_size)
    )

    columns = [c[0] for c in cursor.description]
    rulebooks = []

    for row in cursor.fetchall():
        data = dict(zip(columns, row))
        for k, v in data.items():
            if isinstance(v, datetime):
                data[k] = v.isoformat() + "Z"
        rulebooks.append(data)

    cursor.close()
    conn.close()

    return rulebooks

def create_rule_change_request(
    rule_id,
    proposed_subject,
    proposed_description,
    proposed_rule_logic,
    proposed_bot_id,
    change_summary,
    requested_by_id,
    requested_by_name,
    ):
    DBSCHEMA = get_bot_schema()
    conn = db_connect() if DBSCHEMA != "santova" else connect_to_database()
    if not conn:
        raise Exception("Database connection failed")

    cursor = conn.cursor()

    current_app.logger.info(
        f"CreateRuleChangeRequest | rule_id={rule_id}, requested_by={requested_by_name}"
    )

    cursor.execute(
        f"EXEC {DBSCHEMA}.sp_RequestRuleChange "
        "@RuleId=%s, @ProposedSubject=%s, @ProposedDescription=%s, "
        "@ProposedRuleLogic=%s, @ProposedBotId=%s, @ChangeSummary=%s, "
        "@RequestedById=%s, @RequestedByName=%s",
        (
            rule_id,
            proposed_subject,
            proposed_description,
            proposed_rule_logic,
            proposed_bot_id,
            change_summary,
            requested_by_id,
            requested_by_name,
        ),
    )

    row = cursor.fetchone()
    request_id = row[0] if row else None

    conn.commit()
    cursor.close()
    conn.close()

    return request_id

    # Send email notification asynchronously
    try:
        # Use application level schema for email notifications (ICAT/Santova), not the bot schema
        email_schema = get_db_schema()
        notify_automation_engineers_on_rule_change(
            DBSCHEMA=email_schema,
            rule_id=rule_id,
            proposed_subject=proposed_subject,
            proposed_description=proposed_description,
            requested_by_name=requested_by_name
        )
    except Exception as e:
        current_app.logger.error(f"Failed to trigger rule change notification: {str(e)}")
    

def get_rule_change_requests(status=None, rule_id=None, reviewer_id=None):
    if reviewer_id is None:
        raise Exception("ReviewerId is required")

    DBSCHEMA = get_bot_schema()
    conn = db_connect() if DBSCHEMA != "santova" else connect_to_database()
    if not conn:
        raise Exception("Database connection failed")

    cursor = conn.cursor()
    current_app.logger.info(f"GetRuleChangeRequests | reviewer_id={reviewer_id}, status={status}, rule_id={rule_id}")

    cursor.execute(
        f"EXEC {DBSCHEMA}.sp_GetRuleChangeRequests @ReviewerId=%s, @Status=%s, @RuleId=%s",
        (reviewer_id, status, rule_id)
    )

    columns = [c[0] for c in cursor.description]
    requests = []

    for row in cursor.fetchall():
        data = dict(zip(columns, row))
        for k, v in data.items():
            if isinstance(v, datetime):
                data[k] = v.isoformat() + "Z"
        requests.append(data)

    cursor.close()
    conn.close()
    return requests


def review_rule_change(request_id, action, reviewer_id, reviewer_name, comments=None):
    DBSCHEMA = get_bot_schema()
    conn = db_connect() if DBSCHEMA != "santova" else connect_to_database()
    if not conn:
        raise Exception("Database connection failed")

    cursor = conn.cursor()

    cursor.execute(
        f"EXEC {DBSCHEMA}.sp_ReviewRuleChange "
        "@RequestId=%s, @Action=%s, @ReviewerId=%s, @ReviewerName=%s, @ReviewComments=%s",
        (request_id, action, reviewer_id, reviewer_name, comments),
    )

    conn.commit()
    cursor.close()
    conn.close()


def get_rule_versions(rule_id):
    DBSCHEMA = get_bot_schema()
    conn = db_connect() if DBSCHEMA != "santova" else connect_to_database()
    if not conn:
        raise Exception("Database connection failed")

    cursor = conn.cursor()
    current_app.logger.info(f"GetRuleVersions | rule_id={rule_id}")

    cursor.execute(f"EXEC {DBSCHEMA}.sp_GetRuleVersions @RuleId=%s", (rule_id,))
    columns = [c[0] for c in cursor.description]

    versions = []
    for row in cursor.fetchall():
        data = dict(zip(columns, row))
        for k, v in data.items():
            if isinstance(v, datetime):
                data[k] = v.isoformat() + "Z"
        versions.append(data)

    cursor.close()
    conn.close()
    return versions

