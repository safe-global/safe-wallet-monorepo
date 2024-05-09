CREATE TABLE Account (address VARCHAR(42) PRIMARY KEY);
CREATE TABLE Badges (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    dataOrigin VARCHAR(8) CHECK (dataOrigin IN ('onChain', 'offChain'))
);
CREATE TABLE AccountBadges(
    id SERIAL PRIMARY KEY,
    badgeId INT,
    account VARCHAR(42),
    title TEXT not null,
    points INT not null,
    lastClaim timestamp,
    lastClaimBlock INT,
    isDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (account) REFERENCES Account(address),
    FOREIGN KEY (badgeId) REFERENCES Badges(id)
) CREATE TABLE CITIZENS(
    id SERIAL PRIMARY KEY,
    claimed BOOLEAN DEFAULT FALSE,
    address VARCHAR(42) NOT NULL,
    ens VARCHAR(255)
)