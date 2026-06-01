FROM gradle:9.4.0-jdk21 AS build
WORKDIR /workspace
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./
COPY src ./src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/build/libs/ai-powered-planner-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
