FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml ./
COPY cryptoquiz-admin-module/pom.xml cryptoquiz-admin-module/pom.xml
COPY cryptoquiz-common/pom.xml cryptoquiz-common/pom.xml
COPY cryptoquiz-framework/pom.xml cryptoquiz-framework/pom.xml
COPY cryptoquiz-system/pom.xml cryptoquiz-system/pom.xml
COPY cryptoquiz-quartz/pom.xml cryptoquiz-quartz/pom.xml
COPY cryptoquiz-generator/pom.xml cryptoquiz-generator/pom.xml

COPY cryptoquiz-admin-module/src cryptoquiz-admin-module/src
COPY cryptoquiz-common/src cryptoquiz-common/src
COPY cryptoquiz-framework/src cryptoquiz-framework/src
COPY cryptoquiz-system/src cryptoquiz-system/src
COPY cryptoquiz-quartz/src cryptoquiz-quartz/src
COPY cryptoquiz-generator/src cryptoquiz-generator/src

RUN mvn -pl cryptoquiz-admin-module -am clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

COPY --from=build /app/cryptoquiz-admin-module/target/cryptoquiz-admin.jar /app/cryptoquiz-admin.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/cryptoquiz-admin.jar"]
